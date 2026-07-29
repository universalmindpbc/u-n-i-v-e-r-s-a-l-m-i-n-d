#!/usr/bin/env node

import fs from "node:fs";
import { spawnSync } from "node:child_process";

function redact(value) {
  return String(value || "")
    .replace(/arn:aws:[^\s"']+/g, "[redacted-arn]")
    .replace(/\b\d{12}\b/g, "[redacted-account]")
    .replace(/https:\/\/[^\s"']*awsapps\.com[^\s"']*/g, "[redacted-portal]");
}

export function splitSqlStatements(source) {
  const statements = [];
  let start = 0;
  let quote = null;
  let dollarTag = null;
  let lineComment = false;
  let blockComment = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (dollarTag) {
      if (source.startsWith(dollarTag, index)) {
        index += dollarTag.length - 1;
        dollarTag = null;
      }
      continue;
    }

    if (quote) {
      if (char === quote) {
        if (next === quote) {
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }

    if (char === "-" && next === "-") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }

    if (char === "$") {
      const tag = source.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/)?.[0];
      if (tag) {
        dollarTag = tag;
        index += tag.length - 1;
        continue;
      }
    }

    if (char === ";") {
      const statement = source.slice(start, index + 1).trim();
      if (statement) statements.push(statement);
      start = index + 1;
    }
  }

  const remainder = source.slice(start).trim();
  if (remainder) statements.push(remainder);
  if (quote || dollarTag || blockComment) {
    throw new Error("migration_sql_is_unterminated");
  }
  return statements;
}

function parseArguments(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) throw new Error(`unexpected_argument:${key}`);
    if (key === "--check") {
      args.check = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`missing_value:${key}`);
    args[key.slice(2)] = value;
    index += 1;
  }
  return args;
}

function runAws(awsCli, args) {
  const result = spawnSync(awsCli, [...args, "--no-cli-pager", "--output", "json"], {
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(redact(result.stderr || result.stdout || `aws_exit_${result.status}`));
  }
  const output = result.stdout.trim();
  return output ? JSON.parse(output) : {};
}

function withoutBoundaryComments(statement) {
  return statement.replace(/^\s*(?:--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/\s*)*/g, "").trim();
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const migrationPath = args.migration;
  if (!migrationPath) throw new Error("missing_value:--migration");

  const parsed = splitSqlStatements(fs.readFileSync(migrationPath, "utf8"));
  const statements = parsed.filter((statement) => {
    const normalized = withoutBoundaryComments(statement).replace(/;$/, "").trim().toUpperCase();
    return normalized !== "BEGIN" && normalized !== "COMMIT";
  });

  if (!statements.length) throw new Error("migration_has_no_statements");
  if (args.check) {
    console.log(`migration_statements=${statements.length}`);
    return;
  }

  for (const required of ["resource-arn", "secret-arn", "database", "region", "profile"]) {
    if (!args[required]) throw new Error(`missing_value:--${required}`);
  }

  const awsCli = process.env.AWS_CLI || "aws";
  const base = [
    "--region", args.region,
    "--profile", args.profile,
    "--resource-arn", args["resource-arn"],
    "--secret-arn", args["secret-arn"],
    "--database", args.database,
  ];
  let transactionId = null;

  try {
    const begun = runAws(awsCli, ["rds-data", "begin-transaction", ...base]);
    transactionId = begun.transactionId;
    if (!transactionId) throw new Error("data_api_transaction_id_missing");

    for (let index = 0; index < statements.length; index += 1) {
      runAws(awsCli, [
        "rds-data", "execute-statement",
        ...base,
        "--transaction-id", transactionId,
        "--sql", statements[index],
      ]);
      if ((index + 1) % 10 === 0 || index + 1 === statements.length) {
        console.log(`migration_progress=${index + 1}/${statements.length}`);
      }
    }

    runAws(awsCli, [
      "rds-data", "commit-transaction",
      "--region", args.region,
      "--profile", args.profile,
      "--resource-arn", args["resource-arn"],
      "--secret-arn", args["secret-arn"],
      "--transaction-id", transactionId,
    ]);
    transactionId = null;
    console.log("migration_committed=true");
  } catch (error) {
    if (transactionId) {
      try {
        runAws(awsCli, [
          "rds-data", "rollback-transaction",
          "--region", args.region,
          "--profile", args.profile,
          "--resource-arn", args["resource-arn"],
          "--secret-arn", args["secret-arn"],
          "--transaction-id", transactionId,
        ]);
        console.error("migration_rolled_back=true");
      } catch {
        console.error("migration_rollback_failed=true");
      }
    }
    throw error;
  }
}

main().catch((error) => {
  console.error(redact(error?.message || error));
  process.exitCode = 1;
});

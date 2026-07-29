use std::time::Instant;
use tfhe::{generate_keys, set_server_key, ConfigBuilder, FheUint32};

const DEFAULT_DIMENSIONS: usize = 144;
const MAX_DIMENSIONS: usize = 144;

fn synthetic_score(index: usize) -> u32 {
    ((index as u32 * 73 + 211) % 1001) as u32
}

fn main() {
    let dimensions = std::env::var("UM_ZAMA_DIMENSIONS")
        .ok()
        .and_then(|value| value.parse::<usize>().ok())
        .unwrap_or(DEFAULT_DIMENSIONS)
        .clamp(1, MAX_DIMENSIONS);
    let scores: Vec<u32> = (0..dimensions).map(synthetic_score).collect();
    let expected_sum: u32 = scores.iter().sum();
    let total_started = Instant::now();

    let keygen_started = Instant::now();
    let config = ConfigBuilder::default().build();
    let (client_key, server_key) = generate_keys(config);
    let key_generation_ms = keygen_started.elapsed().as_millis();
    set_server_key(server_key);

    let encryption_started = Instant::now();
    let encrypted_scores: Vec<FheUint32> = scores
        .iter()
        .map(|score| FheUint32::encrypt(*score, &client_key))
        .collect();
    let encryption_ms = encryption_started.elapsed().as_millis();

    let compute_started = Instant::now();
    let mut encrypted_sum = encrypted_scores[0].clone();
    for score in encrypted_scores.iter().skip(1) {
        encrypted_sum += score;
    }
    let encrypted_compute_ms = compute_started.elapsed().as_millis();

    let decryption_started = Instant::now();
    let observed_sum: u32 = encrypted_sum.decrypt(&client_key);
    let decryption_ms = decryption_started.elapsed().as_millis();
    let correct = observed_sum == expected_sum;

    println!(
        "{{\"schema_version\":\"universal_mind_zama_benchmark_result_v1\",\"fixture\":\"synthetic_only\",\"dimensions\":{},\"score_encoding\":\"u32_0_to_1000\",\"key_generation_ms\":{},\"encryption_ms\":{},\"encrypted_compute_ms\":{},\"decryption_ms\":{},\"end_to_end_ms\":{},\"correctness\":{},\"plaintext_values_emitted\":false}}",
        dimensions,
        key_generation_ms,
        encryption_ms,
        encrypted_compute_ms,
        decryption_ms,
        total_started.elapsed().as_millis(),
        correct
    );

    assert!(correct, "encrypted aggregate did not match the plaintext reference");
}

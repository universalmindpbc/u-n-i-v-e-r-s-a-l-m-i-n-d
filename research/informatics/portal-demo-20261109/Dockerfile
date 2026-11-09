FROM 740168708062.dkr.ecr.us-east-1.amazonaws.com/informatics-astra-staging@sha256:82a80f28aaf412402c8baf16a90065fba7d6a069c1b35dd5e10bd9b75e694284
COPY worker.py design.py computation.py verification-fixture.json verify.py /var/task/
RUN python /var/task/verify.py
CMD ["worker.handler"]

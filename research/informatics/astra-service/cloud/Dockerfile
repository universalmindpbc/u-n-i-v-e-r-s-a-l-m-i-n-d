FROM public.ecr.aws/lambda/python:3.12
RUN dnf install -y gcc gcc-c++ make libgomp && dnf clean all
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt cudaq==0.16.0 boto3
COPY workspace /var/task/workspace
COPY runtime.py /var/task/runtime.py
ENV TMPDIR=/tmp OMP_NUM_THREADS=2 OPENBLAS_NUM_THREADS=2
CMD ["runtime.handler"]

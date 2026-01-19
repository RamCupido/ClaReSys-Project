from setuptools import setup, find_packages

setup(
    name="common",
    version="0.1.0",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "pydantic",
        "fastapi",
        "python-jose[cryptography]"
    ],
)
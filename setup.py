"""
Insta485 python package configuration.

Andrew DeOrio <awdeorio@umich.edu>
"""

from setuptools import setup

setup(
    name='ai-hackathon',
    version='0.1.0',
    packages=['insta485'],
    include_package_data=True,
    install_requires=[
        'arrow',
        'bs4',
        'Flask',
        'html5validator',
        'pycodestyle',
        'pydocstyle',
        'pylint',
        'pytest',
        'pytest-mock',
        'requests',
    ],
    python_requires='>=3.6',
)
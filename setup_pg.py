import subprocess
import os
import time

bin_dir = r"d:\Senthil Enterprises\BS Software\pgsql\pgsql\bin"
data_dir = r"d:\Senthil Enterprises\BS Software\pgsql\data"
log_file = r"d:\Senthil Enterprises\BS Software\pgsql\logfile.txt"

try:
    print("Running initdb...")
    subprocess.run([os.path.join(bin_dir, "initdb.exe"), "-D", data_dir, "-U", "postgres", "--auth=trust"], check=True)

    print("Starting postgres...")
    subprocess.run([os.path.join(bin_dir, "pg_ctl.exe"), "-D", data_dir, "-l", log_file, "start"], check=True)
    time.sleep(3)

    print("Configuring DB...")
    # Change password
    subprocess.run([os.path.join(bin_dir, "psql.exe"), "-U", "postgres", "-d", "postgres", "-c", "ALTER USER postgres WITH PASSWORD 'senthil123';"], check=True)
    # Change pg_hba.conf to require md5/scram-sha-256 for network access, wait, for local trust is fine or we can just leave it. 
    # But for safety we set password.
    
    # Create DB
    subprocess.run([os.path.join(bin_dir, "psql.exe"), "-U", "postgres", "-d", "postgres", "-c", "CREATE DATABASE senthil_erp;"], check=True)
    print("PostgreSQL setup successfully.")
except subprocess.CalledProcessError as e:
    print(f"Error: {e}")

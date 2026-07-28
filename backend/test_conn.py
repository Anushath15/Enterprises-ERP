import psycopg
import sys
try:
    conn = psycopg.connect("postgresql://postgres:senthil123@127.0.0.1:5432/senthil_erp")
    print("Connected successfully.")
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

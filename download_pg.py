import urllib.request
import urllib.error

urls = [
    "https://get.enterprisedb.com/postgresql/postgresql-17.2-1-windows-x64-binaries.zip",
    "https://get.enterprisedb.com/postgresql/postgresql-17.10-2-windows-x64-binaries.zip",
    "https://get.enterprisedb.com/postgresql/postgresql-17.2-2-windows-x64-binaries.zip",
    "https://get.enterprisedb.com/postgresql/postgresql-17.1-1-windows-x64-binaries.zip",
    "https://get.enterprisedb.com/postgresql/postgresql-17.0-1-windows-x64-binaries.zip"
]

found = None
for url in urls:
    try:
        print(f"Checking {url}")
        req = urllib.request.Request(url, method="HEAD")
        resp = urllib.request.urlopen(req)
        if resp.status == 200:
            found = url
            print(f"FOUND: {url}")
            break
    except urllib.error.URLError as e:
        print(f"Failed: {e}")

if found:
    print("Downloading...")
    urllib.request.urlretrieve(found, "pg.zip")
    print("Extracting...")
    import zipfile
    with zipfile.ZipFile("pg.zip", 'r') as zip_ref:
        zip_ref.extractall("d:\\Senthil Enterprises\\BS Software\\pgsql")
    print("Done")
else:
    print("Could not find a valid download URL.")

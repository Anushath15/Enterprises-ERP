import glob
import os

patch_code = """from app.security.current_user import get_current_active_user
from app.models.user import User
from app.security.permissions import Role

def override_get_current_active_user():
    return User(id=999, username="testadmin", role=Role.ADMIN, is_active=True, hashed_password="")

app.dependency_overrides[get_current_active_user] = override_get_current_active_user
"""

for file in glob.glob('backend/tests/test_*.py'):
    if 'test_auth.py' in file:
        continue
    with open(file, 'r') as f:
        content = f.read()
    
    if 'override_get_current_active_user' not in content:
        # insert after app.dependency_overrides[get_db] = override_get_db
        target = 'app.dependency_overrides[get_db] = override_get_db\n'
        if target in content:
            new_content = content.replace(target, target + '\n' + patch_code)
            with open(file, 'w') as f:
                f.write(new_content)
            print(f'Patched {file}')

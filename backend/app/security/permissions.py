import enum

class Role(str, enum.Enum):
    ADMIN = "Admin"
    MANAGER = "Manager"
    SALES = "Sales"

# Centralized Permission Matrix
PERMISSION_MATRIX = {
    Role.ADMIN: [
        "products.read", "products.write", "products.delete",
        "sales.read", "sales.create",
        "purchases.read", "purchases.create",
        "expenses.read", "expenses.create",
        "contacts.read", "contacts.write",
        "reports.read", "dashboard.read"
    ],
    Role.MANAGER: [
        "products.read", "products.write",
        "sales.read", "sales.create",
        "purchases.read", "purchases.create",
        "expenses.read", "expenses.create",
        "contacts.read", "contacts.write",
        "reports.read", "dashboard.read"
    ],
    Role.SALES: [
        "products.read",
        "sales.read", "sales.create",
        "contacts.read", "contacts.write",
        "dashboard.read"
    ]
}

def get_role_permissions(role: Role):
    return PERMISSION_MATRIX.get(role, [])

PERMISSION_ACTIONS_BY_PAGE = {
    "admin": ("read", "write"),
    "roles": ("read", "write"),
    "users": ("read", "detail", "write"),
    "pos": ("read", "write"),
    "products": ("read", "detail", "write"),
    "categories": ("read", "detail", "write"),
    "clients": ("read", "detail", "write"),
    "groups": ("read", "detail", "write"),
    "sales": ("read", "detail", "write"),
    "debts": ("read", "detail", "write"),
}


def permission_key(page: str, action: str) -> str:
    return f"{page}:{action}"


ALL_PERMISSIONS = [
    permission_key(page, action)
    for page, actions in PERMISSION_ACTIONS_BY_PAGE.items()
    for action in actions
]

ADMIN_REQUIRED_PERMISSIONS = [
    permission_key("admin", action)
    for action in PERMISSION_ACTIONS_BY_PAGE["admin"]
] + [
    permission_key("roles", action)
    for action in PERMISSION_ACTIONS_BY_PAGE["roles"]
] + [
    permission_key("users", action)
    for action in PERMISSION_ACTIONS_BY_PAGE["users"]
]


SYSTEM_ROLE_DEFINITIONS = (
    ("admin", "Admin"),
    ("manager", "Manager"),
    ("seller", "Seller"),
)


DEFAULT_ROLE_PERMISSIONS = {
    "admin": [
        permission_key(page, action)
        for page, actions in PERMISSION_ACTIONS_BY_PAGE.items()
        for action in actions
    ],
    "manager": [
        permission_key(page, action)
        for page, actions in PERMISSION_ACTIONS_BY_PAGE.items()
        if page not in {"admin", "roles", "users"}
        for action in actions
        if action in {"read", "detail"}
    ],
    "seller": [
        permission_key("pos", "read"),
        permission_key("pos", "write"),
    ],
}

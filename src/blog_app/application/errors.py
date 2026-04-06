class EmailAlreadyRegisteredError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class InvalidRefreshTokenError(Exception):
    pass


class PostNotFoundError(Exception):
    pass


class ForbiddenError(Exception):
    pass


class UserNotFoundError(Exception):
    pass

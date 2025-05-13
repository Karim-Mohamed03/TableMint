import os
from square import Square
# from square.client import Client
from square.environment import SquareEnvironment

square_client = Square(
    environment=SquareEnvironment.SANDBOX,
    token=os.environ['SQUARE_ACCESS_TOKEN']
)

# square_client = Client(
#     access_token=os.getenv("SQUARE_ACCESS_TOKEN"),
#     environment="sandbox"  # or "production"
# )

location_id = os.getenv("SQUARE_LOCATION_ID")

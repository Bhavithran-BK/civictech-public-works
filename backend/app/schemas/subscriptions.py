from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SubscriptionCreateInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    email: str = Field(..., description="Subscriber email address")


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")

    message: str = "Subscribed successfully"

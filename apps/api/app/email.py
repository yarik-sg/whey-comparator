from __future__ import annotations

import logging
from typing import Optional

import httpx

from .config import get_settings

logger = logging.getLogger(__name__)


class EmailClient:
    """Tiny wrapper around Resend's HTTP API.

    The implementation keeps dependencies light weight and gracefully turns into
    a no-op when the configuration is missing. This makes the feature safe to
    enable in development environments while still providing production-ready
    behaviour when the credentials are supplied.
    """

    def __init__(
        self,
        api_key: Optional[str],
        from_email: Optional[str],
        *,
        base_url: str = "https://api.resend.com",
    ) -> None:
        self.api_key = api_key
        self.from_email = from_email
        self.base_url = base_url.rstrip("/")

    def can_send(self) -> bool:
        return bool(self.api_key and self.from_email)

    def send_price_alert(
        self,
        *,
        to: str,
        product_name: str,
        target_price: str,
        current_price: str,
        dashboard_url: Optional[str] = None,
        offer_url: Optional[str] = None,
    ) -> bool:
        if not self.can_send():
            logger.info(
                "Price alert email skipped: missing API key or sender address",
            )
            return False

        subject = f"Baisse de prix détectée pour {product_name}"
        action_url = offer_url or dashboard_url

        body = (
            f"Bonne nouvelle ! Nous avons trouvé {product_name} à {current_price}.\n\n"
            f"Votre alerte était configurée pour être notifiée sous {target_price}."
        )

        if action_url:
            body += f"\n\nConsultez l'offre : {action_url}"

        payload = {
            "from": self.from_email,
            "to": [to],
            "subject": subject,
            "text": body,
        }

        try:
            with httpx.Client(timeout=10) as client:
                response = client.post(
                    f"{self.base_url}/emails",
                    json=payload,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
            response.raise_for_status()
        except httpx.HTTPError as exc:  # pragma: no cover - network edge cases
            logger.error("Failed to send price alert email", exc_info=exc)
            return False

        logger.info("Price alert email sent", extra={"to": to, "product": product_name})
        return True


_email_client: EmailClient | None = None


def get_email_client() -> EmailClient:
    global _email_client
    if _email_client is None:
        settings = get_settings()
        _email_client = EmailClient(
            settings.resend_api_key,
            settings.alerts_from_email,
        )
    return _email_client


def send_price_alert_notification(
    *,
    recipient: str,
    product_name: str,
    target_price: str,
    current_price: str,
    offer_url: Optional[str] = None,
) -> bool:
    settings = get_settings()
    client = get_email_client()
    return client.send_price_alert(
        to=recipient,
        product_name=product_name,
        target_price=target_price,
        current_price=current_price,
        dashboard_url=settings.alerts_dashboard_url,
        offer_url=offer_url,
    )


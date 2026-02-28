from dataclasses import dataclass

@dataclass
class EmailData:
    uid: str
    subject: str
    from_: str
    date: str
    body: str

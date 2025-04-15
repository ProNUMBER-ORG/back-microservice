BillStatus: dict[str, int] = {
    "New": 1,
    "Pending": 2,
    "Error": 3,
    "Success": 4
}

QueueTags: dict[str, str] = {
    "PING": "PING",
    "UPDATE_BILL": "UPDATE_BILL",
    "PROCESS_TEXT": "PROCESS_TEXT"
}

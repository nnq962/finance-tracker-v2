from finance_backend.workers import reminder_messages


def test_catalog_has_all_fifty_messages():
    catalog = reminder_messages.load_messages()
    assert len(catalog) == 50
    assert {entry["id"] for entry in catalog} == set(range(1, 51))
    assert all(
        entry["title"] and entry["body"] and entry["category"] for entry in catalog
    )
    assert all("message" not in entry for entry in catalog)


def test_random_selection_uses_whole_catalog_and_keeps_title_body_pair(monkeypatch):
    catalog = reminder_messages.load_messages()
    choices = iter((0, 49))

    def choose(entries):
        assert entries == catalog
        return entries[next(choices)]

    monkeypatch.setattr(reminder_messages.random, "choice", choose)
    first = reminder_messages.daily_message()
    last = reminder_messages.daily_message()
    assert first == catalog[0]
    assert last == catalog[49]
    first["body"] = "Changed copy"
    assert catalog[0]["body"] != "Changed copy"

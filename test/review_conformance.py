"""Python half of the review conformance test: stdin holds JSON texts, stdout the verdict for each, then encoder checks."""

import sys

import msgspec

from project_metric_contract.review import MAX_ENCODED_BYTES, ProjectReview, ReviewField, ReviewItem, encode


def verdict(text: str) -> str:
    try:
        review = msgspec.json.decode(text, type=ProjectReview)
    except msgspec.ValidationError:
        return "invalid"
    except msgspec.DecodeError:
        return "syntax"
    encode(review)  # a decoded review must encode again
    return "valid"


texts = msgspec.json.decode(sys.stdin.buffer.read(), type=list[str])
item = ReviewItem(id="a", title="t", status="done", status_text="s", fields=[], links=[])
fields = [ReviewField(label="l", text="x" * 5000) for _ in range(20)]
large = ProjectReview(version=1, observed_at="2026-10-03T00:00:00Z", valid_until="2026-10-03T00:00:00Z", items=[
    ReviewItem(id=f"i{n}", title="t", status="done", status_text="s", fields=fields, links=[]) for n in range(20)
])
checks = {}
try:
    encode(msgspec.structs.replace(large, items=[msgspec.structs.replace(item, title="")]))
    checks["constraint"] = "accepted"
except msgspec.ValidationError:
    checks["constraint"] = "rejected"
try:
    encode(large)
    checks["bound"] = "accepted"
except msgspec.ValidationError:
    checks["bound"] = "rejected"
small = msgspec.structs.replace(large, items=[item])
checks["roundTrip"] = encode(small) == msgspec.json.encode(small)
sys.stdout.buffer.write(msgspec.json.encode({"verdicts": [verdict(text) for text in texts], "maxBytes": MAX_ENCODED_BYTES, **checks}))

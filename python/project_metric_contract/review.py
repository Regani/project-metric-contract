# Generated from contracts/project-review.schema.json by scripts/gen-contract.ts. Do not edit.

from __future__ import annotations

from typing import Annotated, Literal

from msgspec import Meta
from msgspec import Struct as _Struct
from msgspec import field


class Struct(_Struct, forbid_unknown_fields=True):
    pass


type Timestamp = Annotated[
    str,
    Meta(
        pattern='^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-5][0-9](?:\\.[0-9]{1,3})?Z$(?![\\s\\S])'
    ),
]


type Text = Annotated[
    str,
    Meta(
        min_length=1,
        pattern='^[^\\u0000-\\u001f\\u007f-\\u009f\\u061c\\u200e\\u200f\\u2028-\\u202e\\u2066-\\u2069]+$(?![\\s\\S])',
    ),
]


type MultilineText = Annotated[
    str,
    Meta(
        description='Text that may contain line feeds; every other control and bidi formatting character is excluded.',
        min_length=1,
        pattern='^[^\\u0000-\\u0009\\u000b-\\u001f\\u007f-\\u009f\\u061c\\u200e\\u200f\\u2028-\\u202e\\u2066-\\u2069]+$(?![\\s\\S])',
    ),
]


type Date = str


type ReviewStatus = Annotated[
    Literal['needs-decision', 'in-progress', 'done', 'blocked'],
    Meta(
        description='needs-decision: waiting for the reviewer; in-progress: the project is working on it; done: nothing left to do; blocked: the project cannot proceed without a fix.'
    ),
]


class ReviewField(Struct):
    label: Annotated[
        str,
        Meta(
            max_length=64,
            min_length=1,
            pattern='^[^\\u0000-\\u001f\\u007f-\\u009f\\u061c\\u200e\\u200f\\u2028-\\u202e\\u2066-\\u2069]+$(?![\\s\\S])',
        ),
    ]
    text: Annotated[
        str,
        Meta(
            description='Text that may contain line feeds; every other control and bidi formatting character is excluded.',
            max_length=5000,
            min_length=1,
            pattern='^[^\\u0000-\\u0009\\u000b-\\u001f\\u007f-\\u009f\\u061c\\u200e\\u200f\\u2028-\\u202e\\u2066-\\u2069]+$(?![\\s\\S])',
        ),
    ]


class ReviewLink(Struct):
    """
    An https page the project points the reviewer to, opened outside the consumer.
    """

    label: Annotated[
        str,
        Meta(
            max_length=64,
            min_length=1,
            pattern='^[^\\u0000-\\u001f\\u007f-\\u009f\\u061c\\u200e\\u200f\\u2028-\\u202e\\u2066-\\u2069]+$(?![\\s\\S])',
        ),
    ]
    url: Annotated[str, Meta(max_length=2048, pattern='^https://[!-~]+$(?![\\s\\S])')]


class ReviewItem(Struct):
    id: Annotated[
        str,
        Meta(
            description='Stable within the project.',
            pattern='^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$(?![\\s\\S])',
        ),
    ]
    title: Annotated[
        str,
        Meta(
            max_length=160,
            min_length=1,
            pattern='^[^\\u0000-\\u001f\\u007f-\\u009f\\u061c\\u200e\\u200f\\u2028-\\u202e\\u2066-\\u2069]+$(?![\\s\\S])',
        ),
    ]
    status: ReviewStatus
    status_text: Annotated[str, Meta(max_length=160, min_length=1, pattern='^[^\\u0000-\\u001f\\u007f-\\u009f\\u061c\\u200e\\u200f\\u2028-\\u202e\\u2066-\\u2069]+$(?![\\s\\S])')] = field(
        name='statusText'
    )
    fields: Annotated[list[ReviewField], Meta(max_length=20)]
    links: Annotated[list[ReviewLink], Meta(max_length=4)]


class ProjectReview(Struct):
    """
    The items a project currently offers for review, read-only. The project owns each item, its status and its text; the consumer owns where the file lives and how it is shown. Timestamps are UTC RFC3339; validUntil is the freshness deadline, with equality still fresh.
    """

    version: Literal[1]
    observed_at: Timestamp = field(name='observedAt')
    valid_until: Timestamp = field(name='validUntil')
    items: Annotated[list[ReviewItem], Meta(max_length=20)]

# The producer's one output boundary.
import msgspec  # noqa: E402

MAX_ENCODED_BYTES = 65536
"""The most UTF-8 bytes one encoded review may take; the consumer reads no more."""


def encode(review: ProjectReview) -> bytes:
    """Encode a review, or raise msgspec.ValidationError when it breaks the schema or the byte bound."""
    data = msgspec.json.encode(review)
    msgspec.json.decode(data, type=ProjectReview)
    if len(data) > MAX_ENCODED_BYTES:
        raise msgspec.ValidationError(f"Encoded review takes {len(data)} bytes; the bound is {MAX_ENCODED_BYTES}")
    return data

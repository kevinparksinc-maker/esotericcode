# I Ching Changing-Line Model for EsotericCode

## Casting convention

The complete implementation uses six lines ordered from **bottom to top**. A line value records both polarity and whether that polarity is stable or changing:

| Value | Line state | Result after transformation |
|---:|---|---|
| 6 | Old yin, changing | Yang |
| 7 | Young yang, stable | Yang |
| 8 | Young yin, stable | Yin |
| 9 | Old yang, changing | Yin |

The primary hexagram describes the present pattern. Each moving line is read in its position, and only the moving lines flip to create the relating (transformed) hexagram. The transformed figure represents the direction of the active change; it does not displace the primary figure. When no lines move, the reading is static and has no transformed hexagram.

## EsotericCode design application

Repository metrics deterministically generate six traditional line values. The system will persist the primary hexagram, all six line values, each active line and its developer-focused interpretation, the transformed hexagram when present, and a synthesis connecting the present system to its direction of change.

## Sources consulted

1. [Yarrow: I Ching changing lines explained](https://www.yarrow.life/guides/changing-lines-explained), consulted for the 6/7/8/9 convention, bottom-up line order, and primary-to-transformed reading sequence.
2. [I Ching with Clarity: Hexagrams and changing lines](https://www.onlineclarity.co.uk/learn/beginners/hexagrams-and-changing-lines/), consulted as an independent reference for primary and relating hexagrams.

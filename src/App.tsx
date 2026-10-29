import { FormEvent, useEffect, useMemo, useState } from "react"

const A = "/assets"

type Book = {
  id: string
  title: string
  author: string
  memory: string
}

type JournalEntry = {
  id: string
  date: string
  text: string
}

type Scene = "entry" | "library" | "closing"
type Overlay = "none" | "settings" | "book" | "visitor" | "journal"

const GAME_DAY_DURATION = 8 * 60 * 1000
const GAME_START_MINUTES = 8 * 60 + 15
const GAME_END_MINUTES = 17 * 60

const starterBooks: Book[] = [
  {
    id: "jane-eyre",
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    memory:
      "Jane Eyre reminds me that being loved is wonderful, but never more important than being true to myself.",
  },
  {
    id: "little-women",
    title: "Little Women",
    author: "Louisa May Alcott",
    memory:
      "A home can be made from stories, laughter, and the people who keep choosing one another.",
  },
  {
    id: "secret-garden",
    title: "The Secret Garden",
    author: "Frances Hodgson Burnett",
    memory: "Some quiet places wake up only when we care for them.",
  },
]

const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

function App() {
  const [scene, setScene] = useState<Scene>("entry")
  const [overlay, setOverlay] = useState<Overlay>("none")
  const [books, setBooks] = useState<Book[]>(() =>
    readStored("between-pages-books", starterBooks),
  )
  const [journals, setJournals] = useState<JournalEntry[]>(() =>
    readStored("between-pages-journals", []),
  )
  const [selectedBook, setSelectedBook] = useState<Book>(starterBooks[0])
  const [query, setQuery] = useState("")
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [gameDay, setGameDay] = useState(1)
  const [dayStartedAt, setDayStartedAt] = useState(() => Date.now())
  const [visitorStep, setVisitorStep] = useState(0)
  const [activeVisitor, setActiveVisitor] = useState<"brown" | "pink">("brown")
  const [pinkVisitorClicked, setPinkVisitorClicked] = useState(false)
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(
    null,
  )
  const [quietMode, setQuietMode] = useState(() =>
    readStored("between-pages-quiet", true),
  )
  const [reducedMotion, setReducedMotion] = useState(() =>
    readStored("between-pages-reduced-motion", false),
  )

  useEffect(
    () => localStorage.setItem("between-pages-books", JSON.stringify(books)),
    [books],
  )
  useEffect(
    () =>
      localStorage.setItem("between-pages-journals", JSON.stringify(journals)),
    [journals],
  )
  useEffect(
    () =>
      localStorage.setItem("between-pages-quiet", JSON.stringify(quietMode)),
    [quietMode],
  )
  useEffect(
    () =>
      localStorage.setItem(
        "between-pages-reduced-motion",
        JSON.stringify(reducedMotion),
      ),
    [reducedMotion],
  )

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return books
    return books.filter(
      (book) =>
        book.title.toLowerCase().includes(needle) ||
        book.author.toLowerCase().includes(needle),
    )
  }, [books, query])

  const openBook = (book: Book) => {
    setSelectedBook(book)
    setOverlay("book")
  }

  const startLibrary = () => {
    setDayStartedAt(Date.now())
    setScene("library")
    setOverlay("none")
  }

  const closeLibrary = () => {
    const entry: JournalEntry = {
      id: `day-${gameDay}-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      text:
        visitorStep >= 3
          ? `Day ${gameDay} has come to a close. A visitor left behind a new thought about Jane Eyre, and the quiet library held onto it.`
          : `Day ${gameDay} has come to a close. The books are back on their shelves, waiting for tomorrow's visitors.`,
    }
    setJournals((current) => [entry, ...current])
    setSelectedJournal(entry)
    setScene("closing")
    setOverlay("journal")
  }

  return (
    <main className={reducedMotion ? "app reduce-motion" : "app"}>
      {scene === "entry" && (
        <EntryScreen
          onStart={startLibrary}
          onSettings={() => setOverlay("settings")}
        />
      )}

      {scene === "library" && (
        <Library
          books={books}
          matches={matches}
          query={query}
          libraryOpen={libraryOpen}
          gameDay={gameDay}
          dayStartedAt={dayStartedAt}
          visitorStep={visitorStep}
          pinkVisitorClicked={pinkVisitorClicked}
          onSearch={setQuery}
          onBack={() => {
            setScene("entry")
            setOverlay("none")
          }}
          onOpen={() => {
            setLibraryOpen(true)
          }}
          onClose={closeLibrary}
          onBook={openBook}
          onVisitor={(visitor) => {
            setActiveVisitor(visitor)
            if (visitor === "pink") setPinkVisitorClicked(true)
            setVisitorStep(1)
            setOverlay("visitor")
          }}
          onJournal={() => setOverlay("journal")}
        />
      )}

      {scene === "closing" && (
        <ClosingScreen
          onReturn={() => {
            setScene("entry")
            setLibraryOpen(false)
            setVisitorStep(0)
            setGameDay((current) => current + 1)
          }}
          onReopen={() => {
            setScene("library")
            setLibraryOpen(true)
            setGameDay((current) => current + 1)
            setDayStartedAt(Date.now())
          }}
        />
      )}

      {overlay === "settings" && (
        <SettingsPanel
          quietMode={quietMode}
          reducedMotion={reducedMotion}
          onQuiet={setQuietMode}
          onMotion={setReducedMotion}
          onClose={() => setOverlay("none")}
        />
      )}
      {overlay === "book" && (
        <BookDetails book={selectedBook} onClose={() => setOverlay("none")} />
      )}
      {overlay === "visitor" && (
        <VisitorDialogue
          visitor={activeVisitor}
          step={visitorStep}
          onContinue={() => setVisitorStep(2)}
          onChoose={(memory) => {
            setVisitorStep(3)
            setBooks((current) =>
              current.map((book) =>
                book.id === "jane-eyre"
                  ? { ...book, memory: `${book.memory} ${memory}` }
                  : book,
              ),
            )
          }}
          onClose={() => setOverlay("none")}
        />
      )}
      {overlay === "journal" && (
        <Journal
          entries={journals}
          selected={selectedJournal}
          onSelect={setSelectedJournal}
          onClose={() => {
            setSelectedJournal(null)
            setOverlay("none")
          }}
          onSave={(entry) => {
            setJournals((current) => [entry, ...current])
            setSelectedJournal(entry)
          }}
        />
      )}
    </main>
  )
}

function EntryScreen({
  onStart,
  onSettings,
}: {
  onStart: () => void
  onSettings: () => void
}) {
  return (
    <section
      className="entry scene-fade"
      aria-label="Between the Pages title screen"
    >
      <div className="entry-art" aria-hidden="true">
        <div className="entry-crop entry-crop-left">
          <img src={`${A}/ba9a6.png`} alt="" />
        </div>
        <div className="entry-crop entry-crop-center">
          <img src={`${A}/f51f4.png`} alt="" />
        </div>
        <div className="entry-crop entry-crop-right">
          <img src={`${A}/8a2d3.png`} alt="" />
        </div>
      </div>
      <div className="entry-copy">
        <h1>Between the Pages</h1>
        <p>
          Let every book you have read become a memory you can step back into.
        </p>
        <div className="entry-actions">
          <button onClick={onStart}>Start</button>
          <button onClick={onSettings}>Setting</button>
        </div>
      </div>
    </section>
  )
}

type LibraryProps = {
  books: Book[]
  matches: Book[]
  query: string
  libraryOpen: boolean
  gameDay: number
  dayStartedAt: number
  visitorStep: number
  pinkVisitorClicked: boolean
  onSearch: (value: string) => void
  onBack: () => void
  onOpen: () => void
  onClose: () => void
  onBook: (book: Book) => void
  onVisitor: (visitor: "brown" | "pink") => void
  onJournal: () => void
}

function Library({
  books,
  matches,
  query,
  libraryOpen,
  gameDay,
  dayStartedAt,
  visitorStep,
  pinkVisitorClicked,
  onSearch,
  onBack,
  onOpen,
  onClose,
  onBook,
  onVisitor,
  onJournal,
}: LibraryProps) {
  const [now, setNow] = useState(() => Date.now())
  const [nightNoticeDismissed, setNightNoticeDismissed] = useState(false)
  const [showVisitorPrompt, setShowVisitorPrompt] = useState(true)
  const [showPinkPrompt, setShowPinkPrompt] = useState(true)
  const [showOpenNotice, setShowOpenNotice] = useState(false)
  const [showReaderPrompt, setShowReaderPrompt] = useState(false)
  const [brownVisitorVisible, setBrownVisitorVisible] = useState(false)
  const [pinkVisitorVisible, setPinkVisitorVisible] = useState(false)

  useEffect(() => {
    setNow(Date.now())
    setNightNoticeDismissed(false)

    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [dayStartedAt])

  useEffect(() => {
    if (libraryOpen) {
      setShowOpenNotice(false)
      return
    }

    setShowOpenNotice(false)
    const timer = window.setTimeout(() => setShowOpenNotice(true), 3000)
    return () => window.clearTimeout(timer)
  }, [dayStartedAt, libraryOpen])

  useEffect(() => {
    setBrownVisitorVisible(false)
    setPinkVisitorVisible(false)
    if (!libraryOpen) return

    const firstDelay = 1500 + Math.random() * 3500
    const secondDelay = firstDelay + 2500 + Math.random() * 5000
    const brownArrivesFirst = Math.random() < 0.5

    const firstTimer = window.setTimeout(() => {
      if (brownArrivesFirst) {
        setBrownVisitorVisible(true)
      } else {
        setPinkVisitorVisible(true)
      }
    }, firstDelay)

    const secondTimer = window.setTimeout(() => {
      if (brownArrivesFirst) {
        setPinkVisitorVisible(true)
      } else {
        setBrownVisitorVisible(true)
      }
    }, secondDelay)

    return () => {
      window.clearTimeout(firstTimer)
      window.clearTimeout(secondTimer)
    }
  }, [dayStartedAt, libraryOpen])

  useEffect(() => {
    if (visitorStep < 3) {
      setShowVisitorPrompt(true)
      return
    }

    setShowVisitorPrompt(false)
    let showTimer: number | undefined
    let hideTimer: number | undefined

    const schedulePrompt = () => {
      const wait = 7000 + Math.random() * 11000
      showTimer = window.setTimeout(() => {
        setShowVisitorPrompt(true)
        const visibleFor = 2500 + Math.random() * 2000
        hideTimer = window.setTimeout(() => {
          setShowVisitorPrompt(false)
          schedulePrompt()
        }, visibleFor)
      }, wait)
    }

    schedulePrompt()
    return () => {
      if (showTimer) window.clearTimeout(showTimer)
      if (hideTimer) window.clearTimeout(hideTimer)
    }
  }, [visitorStep])

  useEffect(() => {
    if (!pinkVisitorClicked) {
      setShowPinkPrompt(true)
      return
    }

    setShowPinkPrompt(false)
    let showTimer: number | undefined
    let hideTimer: number | undefined

    const schedulePrompt = () => {
      const wait = 8000 + Math.random() * 12000
      showTimer = window.setTimeout(() => {
        setShowPinkPrompt(true)
        const visibleFor = 2500 + Math.random() * 2000
        hideTimer = window.setTimeout(() => {
          setShowPinkPrompt(false)
          schedulePrompt()
        }, visibleFor)
      }, wait)
    }

    schedulePrompt()
    return () => {
      if (showTimer) window.clearTimeout(showTimer)
      if (hideTimer) window.clearTimeout(hideTimer)
    }
  }, [pinkVisitorClicked])

  useEffect(() => {
    if (!libraryOpen) {
      setShowReaderPrompt(false)
      return
    }

    let showTimer: number | undefined
    let hideTimer: number | undefined

    const schedulePrompt = () => {
      const wait = 6000 + Math.random() * 12000
      showTimer = window.setTimeout(() => {
        setShowReaderPrompt(true)
        const visibleFor = 4500 + Math.random() * 1000
        hideTimer = window.setTimeout(() => {
          setShowReaderPrompt(false)
          schedulePrompt()
        }, visibleFor)
      }, wait)
    }

    schedulePrompt()
    return () => {
      if (showTimer) window.clearTimeout(showTimer)
      if (hideTimer) window.clearTimeout(hideTimer)
    }
  }, [dayStartedAt, libraryOpen])

  const dayProgress = Math.min(
    Math.max((now - dayStartedAt) / GAME_DAY_DURATION, 0),
    1,
  )
  const gameMinutes = Math.floor(
    GAME_START_MINUTES +
      dayProgress * (GAME_END_MINUTES - GAME_START_MINUTES),
  )
  const gameTime = `${String(Math.floor(gameMinutes / 60)).padStart(2, "0")}:${String(gameMinutes % 60).padStart(2, "0")}`
  const isNight = dayProgress >= 1
  const visibleVisitors =
    Number(brownVisitorVisible) + Number(pinkVisitorVisible)

  return (
    <section
      className={`library ${libraryOpen ? "is-open" : ""} ${isNight ? "is-night" : ""} scene-fade`}
    >
      <div className="canvas">
        <div className="library-shell" aria-hidden="true">
          <img className="roof roof-one" src={`${A}/b2c84.svg`} alt="" />
          <img className="roof roof-two" src={`${A}/7fc76.svg`} alt="" />
        </div>

        <button className="back-button" onClick={onBack}>
          <img src={`${A}/${isNight ? "cc8ec.svg" : "02290.svg"}`} alt="" />
          back
        </button>

        <div className="day-card">
          <img src={`${A}/e6244.svg`} alt="" />
          <span className="day">Day {gameDay}</span>
          <b>{gameTime}</b>
          <img
            className="mode"
            src={`${A}/${isNight ? "c9e04.svg" : "25c7f.svg"}`}
            alt=""
          />
          <span className="stats">
            {books.length} books&nbsp; I &nbsp;{visibleVisitors} visitor
            {visibleVisitors === 1 ? "" : "s"}
          </span>
        </div>

        <button
          className="journal-button"
          onClick={onJournal}
          aria-label="Open daily journal"
        >
          <img src={`${A}/${isNight ? "0cdca.svg" : "5cc33.svg"}`} alt="" />
        </button>

        <label className="search">
          <img src={`${A}/c660a.svg`} alt="" />
          <input
            value={query}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search for books"
            aria-label="Search for books"
          />
        </label>

        <LibraryFurniture
          onShelf={() => matches[0] && onBook(matches[0])}
          showReaderPrompt={showReaderPrompt}
        />

        <button
          className="book-hotspot"
          onClick={() => matches[0] && onBook(matches[0])}
        >
          <span className="book-outline" />
          <span className="book-label">
            {matches[0] ? `‹${matches[0].title}›` : "No book found"}
          </span>
        </button>

        <button
          type="button"
          className="right-book-hotspot"
          aria-label="Harry Porter"
        >
          <span className="right-book-outline" />
          <span className="right-book-label">&lt;Harry Potter&gt;</span>
        </button>

        {query && (
          <div className="search-results">
            {matches.map((book) => (
              <button key={book.id} onClick={() => onBook(book)}>
                <span>{book.title}</span>
                <small>{book.author}</small>
              </button>
            ))}
            {matches.length === 0 && <p>No memories found on these shelves.</p>}
          </div>
        )}

        {libraryOpen && brownVisitorVisible && (
          <button
            className="visitor visitor-main"
            onClick={() => onVisitor("brown")}
            aria-label="Talk to visitor"
          >
            <span />
            {showVisitorPrompt && <i>Something to say</i>}
          </button>
        )}

        {libraryOpen && pinkVisitorVisible && (
          <button
            className="visitor visitor-pink"
            onClick={() => onVisitor("pink")}
            aria-label="Talk to pink visitor"
          >
            <span />
            {showPinkPrompt && <i>Something to say</i>}
          </button>
        )}

        <button
          className={`door-button ${libraryOpen ? "closing" : ""}`}
          onClick={libraryOpen ? onClose : onOpen}
        >
          {libraryOpen ? "CLOSE" : "OPEN"}
        </button>

        {!libraryOpen && showOpenNotice && (
          <div className="notice">
            <h2>Notice</h2>
            <p>Click OPEN to open the door</p>
            <div>
              <button onClick={onBack}>Later</button>
              <button onClick={onOpen}>Now</button>
            </div>
          </div>
        )}

        {libraryOpen && isNight && !nightNoticeDismissed && (
          <div className="notice night-notice" role="alert" aria-live="assertive">
            <button
              className="night-notice-close"
              onClick={() => setNightNoticeDismissed(true)}
              aria-label="Close closing-time notice"
            >
              <img src={`${A}/2c6d6.svg`} alt="" />
            </button>
            <h2>Notice</h2>
            <img
              className="night-notice-clock"
              src={`${A}/yellow-clock.png`}
              alt=""
            />
            <p>It is closing time now</p>
          </div>
        )}
      </div>
    </section>
  )
}

function LibraryFurniture({
  onShelf,
  showReaderPrompt,
}: {
  onShelf: () => void
  showReaderPrompt: boolean
}) {
  return (
    <div className="furniture">
      <img
        className="item wall-shelf"
        src={`${A}/51f96.png`}
        alt="A shelf of plants and books"
      />
      <img
        className="item right-bookshelf"
        src={`${A}/right-bookshelf.png`}
        alt="A shelf of colorful books"
      />
      <button
        className="item books-left"
        onClick={onShelf}
        aria-label="Browse this bookshelf"
      >
        <img src={`${A}/7f37c.png`} alt="A shelf filled with colorful books" />
      </button>
      <img
        className="item tall-shelf"
        src={`${A}/c5473.png`}
        alt="A tall wooden shelf with plants"
      />
      <div className="item center-shelf">
        <img
          src={`${A}/6e4ba.png`}
          alt="A small shelf with books, a globe, and plants"
        />
      </div>
      <img
        className="item sofa"
        src={`${A}/0648d.png`}
        alt="A soft pink reading sofa"
      />
      <div className="item reader">
        <img
          src={`${A}/e8332.png`}
          alt="A reader carrying a tall stack of books"
        />
        {showReaderPrompt && <i>Are there any new books today?</i>}
      </div>
      <img
        className="item cabinet"
        src={`${A}/d33d2.png`}
        alt="A wooden book cabinet"
      />
      <div className="item counter">
        <img src={`${A}/fd37f.png`} alt="A green counter with tea and cakes" />
      </div>
      <div className="item chair">
        <img src={`${A}/1e111.png`} alt="A green chair" />
      </div>
      <img className="item rug" src={`${A}/47a36.png`} alt="" />
    </div>
  )
}

function BookDetails({ book, onClose }: { book: Book onClose: () => void }) {
  return (
    <Modal onClose={onClose} dark>
      <article
        className="book-detail"
        onClick={(event) => event.stopPropagation()}
      >
        <img className="book-paper" src={`${A}/4bd46.png`} alt="" />
        <img
          className="jane-illustration"
          src={`${A}/49934.png`}
          alt="Jane Eyre in front of Thornfield"
        />
        <div className="book-left-copy">
          <h2>‹{book.title}›</h2>
          <p>Love should never come at the cost of self-respect.</p>
        </div>
        <div className="book-right-copy">
          <time>28.10.26</time>
          <p>
            A woman deserves freedom, dignity, and the right to choose her own
            life.
          </p>
          <p>True love is built on equality, honesty, and mutual respect.</p>
          <h3>My Thoughts</h3>
          <p>
            {book.memory || "This book is waiting for a memory of your own."}
          </p>
          <blockquote>
            “I am no bird; and no net ensnares me: I am a free human being with
            an independent will.”
          </blockquote>
          <img src={`${A}/75e0b.png`} alt="A tiny storybook sitting room" />
        </div>
      </article>
      <p className="return-hint">Click anywhere to return</p>
    </Modal>
  )
}

function VisitorDialogue({
  visitor,
  step,
  onContinue,
  onChoose,
  onClose,
}: {
  visitor: "brown" | "pink"
  step: number
  onContinue: () => void
  onChoose: (memory: string) => void
  onClose: () => void
}) {
  return (
    <div
      className={`dialogue-layer ${step <= 1 ? "is-continuable" : ""}`}
      onClick={step <= 1 ? onContinue : undefined}
    >
      {step <= 1 && (
        <button
          className={`visitor portrait-visitor ${visitor === "pink" ? "is-pink" : ""}`}
          onClick={(event) => {
            event.stopPropagation()
            onClose()
          }}
          aria-label="Close conversation"
        >
          <span />
        </button>
      )}
      {step <= 1 && (
        <button className="dialogue-box" onClick={onContinue}>
          “Sometimes I feel that Jane Eyre is too stubborn. If she had been
          willing to compromise a little, perhaps she wouldn’t have had to
          endure so much suffering.”
          <small>Click anywhere to continue</small>
        </button>
      )}
      {step === 2 && (
        <div className="dialogue-box choices">
          <button
            onClick={() =>
              onChoose(
                "I told a visitor that holding your ground is not the same as stubbornness.",
              )
            }
          >
            She isn’t being stubborn; she’s holding her ground.
          </button>
          <b>or</b>
          <button
            onClick={() =>
              onChoose(
                "A visitor reminded me that real life sometimes asks for careful compromise.",
              )
            }
          >
            She is worthy of admiration, but reality calls for more careful
            weighing of factors.
          </button>
          <small>Please select an answer to continue</small>
        </div>
      )}
      {step >= 3 && (
        <button className="dialogue-box" onClick={onClose}>
          “Perhaps that is why books stay with us. They leave a question open,
          even after the last page.”
          <small>Click anywhere to return</small>
        </button>
      )}
    </div>
  )
}

function Journal({
  entries,
  selected,
  onSelect,
  onClose,
  onSave,
}: {
  entries: JournalEntry[]
  selected: JournalEntry | null
  onSelect: (entry: JournalEntry | null) => void
  onClose: () => void
  onSave: (entry: JournalEntry) => void
}) {
  if (selected) {
    return (
      <Modal onClose={onClose} dark>
        <article
          className="journal-card"
          onClick={onClose}
        >
          <img src={`${A}/01186.png`} alt="" />
          <div className="journal-date">
            <b>{new Date(`${selected.date}T12:00:00`).getDate()}</b>
            <span>
              {new Date(`${selected.date}T12:00:00`).toLocaleDateString("en", {
                weekday: "long",
                month: "long",
              })}
            </span>
          </div>
          <h2>Even in memory, hold onto yourself.</h2>
          <p>{selected.text}</p>
          <button
            className="journal-back"
            onClick={(event) => {
              event.stopPropagation()
              onSelect(null)
            }}
          >
            Back to entries
          </button>
        </article>
        <p className="return-hint">Click outside the page to return</p>
      </Modal>
    )
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = String(data.get("entry") || "").trim()
    if (!text) return
    onSave({
      id: `${Date.now()}`,
      date: String(data.get("date")),
      text,
    })
  }

  return (
    <Modal onClose={onClose}>
      <section className="journal-panel">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <p className="eyebrow">A quiet record of today</p>
        <h2>Daily journal</h2>
        <form onSubmit={submit}>
          <input
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
          <textarea
            name="entry"
            required
            rows={6}
            placeholder="What stayed with you between the pages today?"
          />
          <button className="peach-button" type="submit">
            Save entry
          </button>
        </form>
        <div className="past-entries">
          <h3>Past pages</h3>
          {entries.map((entry) => (
            <button key={entry.id} onClick={() => onSelect(entry)}>
              <time>{entry.date}</time>
              <span>{entry.text}</span>
            </button>
          ))}
          {entries.length === 0 && <p>Your saved entries will gather here.</p>}
        </div>
      </section>
    </Modal>
  )
}

function SettingsPanel({
  quietMode,
  reducedMotion,
  onQuiet,
  onMotion,
  onClose,
}: {
  quietMode: boolean
  reducedMotion: boolean
  onQuiet: (value: boolean) => void
  onMotion: (value: boolean) => void
  onClose: () => void
}) {
  return (
    <Modal onClose={onClose}>
      <section className="settings-panel">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <p className="eyebrow">Make the room your own</p>
        <h2>Setting</h2>
        <label className="toggle-row">
          <span>
            Quiet room
            <small>Keep the library still and soundless.</small>
          </span>
          <input
            type="checkbox"
            checked={quietMode}
            onChange={(event) => onQuiet(event.target.checked)}
          />
        </label>
        <label className="toggle-row">
          <span>
            Gentle transitions
            <small>Turn off movement between scenes.</small>
          </span>
          <input
            type="checkbox"
            checked={!reducedMotion}
            onChange={(event) => onMotion(!event.target.checked)}
          />
        </label>
        <button className="peach-button" onClick={onClose}>
          Done
        </button>
      </section>
    </Modal>
  )
}

function ClosingScreen({
  onReturn,
  onReopen,
}: {
  onReturn: () => void
  onReopen: () => void
}) {
  return (
    <section className="closing-scene scene-fade">
      <div className="night-houses">
        <div />
        <div />
        <div />
      </div>
      <div className="closing-copy">
        <p>The last visitor has gone home.</p>
        <h1>The library is quiet now.</h1>
        <span>
          Some stories wait on the shelves. Others follow us into dreams.
        </span>
        <div>
          <button onClick={onReturn}>Close for the night</button>
          <button onClick={onReopen}>One more page</button>
        </div>
      </div>
    </section>
  )
}

function Modal({
  children,
  onClose,
  dark = false,
}: {
  children: React.ReactNode
  onClose: () => void
  dark?: boolean
}) {
  return (
    <div className={`modal-layer ${dark ? "dark" : ""}`} onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()}>{children}</div>
    </div>
  )
}

export default App


import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { getGames, launchGame } from "../../services/gameService";
import { useAuth } from "../../context/AuthContext";

// Games listed here are pulled to the front of the list, in this order.
const GAME_NAME_PRIORITY = ["5 five cricket"];

const ProviderGridSlider = () => {
  const { user } = useAuth();

  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const offsetRef = useRef(0);
  const isPausedRef = useRef(false);

  // ── Drag / swipe refs ────────────────────────────────────────────────
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const dragMovedRef = useRef(0);
  const pointerIdRef = useRef(null);
  const pointerDownGameRef = useRef(null);

  const [games, setGames] = useState([]);
  const [hiddenGameIds, setHiddenGameIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const gamesRef = useRef([]);

  const navigate = useNavigate();

  // =====================================
  // FETCH GAMES
  // =====================================

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await getGames(140);
        const gameList = res.games || [];

        const virtualGames = gameList.filter((g) => {
          // Must be a live category game
          if (!g.category?.toLowerCase().includes("live")) {
            return false;
          }

          // =====================================
          // IMAGE CHECK
          // =====================================

          // No image field
          if (!g.image || typeof g.image !== "string") {
            return false;
          }

          const imageUrl = g.image.trim();

          // Empty image
          if (imageUrl === "") {
            return false;
          }

          // Hide known broken / placeholder image paths
          if (
            imageUrl.includes("/images/index.png") ||
            imageUrl.toLowerCase().includes("placeholder") ||
            imageUrl.toLowerCase().includes("no-image") ||
            imageUrl.toLowerCase().includes("no_image")
          ) {
            return false;
          }

          // =====================================
          // MAINTENANCE CHECK
          // =====================================

          if (
            g.status === "maintenance" ||
            g.is_maintenance === true ||
            g.under_maintenance === true ||
            g.active === false ||
            g.enabled === false
          ) {
            return false;
          }

          return true;
        });

        // =====================================
        // GAME NAME PRIORITY
        // =====================================

        const getNameKey = (g) =>
          String(g.name || "")
            .trim()
            .toLowerCase();

        const priorityRank = new Map(
          GAME_NAME_PRIORITY.map((name, idx) => [
            name.toLowerCase(),
            idx,
          ])
        );

        const prioritized = [];
        const rest = [];

        virtualGames.forEach((g) => {
          if (priorityRank.has(getNameKey(g))) {
            prioritized.push(g);
          } else {
            rest.push(g);
          }
        });

        // Keep priority order stable
        prioritized.sort(
          (a, b) =>
            priorityRank.get(getNameKey(a)) -
            priorityRank.get(getNameKey(b))
        );

        const orderedGames = [
          ...prioritized,
          ...rest,
        ];

        setGames(orderedGames);
        gamesRef.current = orderedGames;
      } catch (err) {
        console.error("Failed to fetch games:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  // =====================================
  // HIDE GAME
  // =====================================

  const hideGame = useCallback((gameUid) => {
    if (gameUid == null) return;

    setHiddenGameIds((prev) => {
      const next = new Set(prev);
      next.add(gameUid);
      return next;
    });
  }, []);

  // =====================================
  // VISIBLE GAMES
  // =====================================

  const visibleGames = useMemo(
    () =>
      games.filter(
        (g) => !hiddenGameIds.has(g.game_uid)
      ),
    [games, hiddenGameIds]
  );

  // =====================================
  // DUPLICATE LIST FOR LOOP
  // =====================================

  const loopGames = useMemo(
    () =>
      visibleGames.length
        ? [...visibleGames, ...visibleGames]
        : [],
    [visibleGames]
  );

  // =====================================
  // MOUSE ENTER
  // =====================================

  const handleMouseEnter = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  // =====================================
  // MOUSE LEAVE
  // =====================================

  const handleMouseLeave = useCallback(() => {
    if (!isDraggingRef.current) {
      isPausedRef.current = false;
    }
  }, []);

  // =====================================
  // NUDGE BUTTONS
  // =====================================

  const nudge = (dir) => {
    const track = trackRef.current;

    if (!track) return;

    const halfWidth = track.scrollWidth / 2;

    if (halfWidth <= 0) return;

    let next =
      offsetRef.current +
      (dir === "left" ? -400 : 400);

    // Wrap around cleanly
    if (next < 0) {
      next += halfWidth;
    }

    if (next >= halfWidth) {
      next -= halfWidth;
    }

    offsetRef.current = next;

    track.style.transform =
      `translateX(-${offsetRef.current}px)`;
  };

  // =====================================
  // CLAMP OFFSET TO LOOP
  // =====================================

  const clampOffsetToLoop = (value) => {
    const track = trackRef.current;

    if (!track) return value;

    const halfWidth = track.scrollWidth / 2;

    if (halfWidth <= 0) return value;

    let v = value;

    while (v < 0) {
      v += halfWidth;
    }

    while (v >= halfWidth) {
      v -= halfWidth;
    }

    return v;
  };

  // =====================================
  // POINTER DOWN
  // =====================================

  const handlePointerDown = useCallback((e) => {
    // Only left mouse button
    if (
      e.pointerType === "mouse" &&
      e.button !== 0
    ) {
      return;
    }

    isDraggingRef.current = true;
    isPausedRef.current = true;

    dragMovedRef.current = 0;

    dragStartXRef.current = e.clientX;

    dragStartOffsetRef.current =
      offsetRef.current;

    pointerIdRef.current = e.pointerId;

    // Remember card under pointer
    const cardEl =
      e.target.closest?.(
        ".provider-grid-card"
      );

    pointerDownGameRef.current =
      cardEl?.dataset?.gameUid ?? null;

    try {
      e.currentTarget.setPointerCapture(
        e.pointerId
      );
    } catch (err) {
      // Ignore
    }
  }, []);

  // =====================================
  // POINTER MOVE
  // =====================================

  const handlePointerMove = useCallback((e) => {
    if (!isDraggingRef.current) return;

    if (
      pointerIdRef.current !== null &&
      e.pointerId !== pointerIdRef.current
    ) {
      return;
    }

    const delta =
      e.clientX - dragStartXRef.current;

    dragMovedRef.current =
      Math.abs(delta);

    const track = trackRef.current;

    if (!track) return;

    const nextOffset =
      clampOffsetToLoop(
        dragStartOffsetRef.current -
          delta
      );

    offsetRef.current = nextOffset;

    track.style.transform =
      `translateX(-${nextOffset}px)`;
  }, []);

  // =====================================
  // GAME CLICK / LAUNCH
  // =====================================

  const handleCardClick = useCallback(
    async (game) => {
      // Don't launch after a swipe
      if (dragMovedRef.current > 8) {
        dragMovedRef.current = 0;
        return;
      }

      try {
        // Login check
        if (!user?._id) {
          alert("Please login first");
          return;
        }

        // Demo account check
        if (user?.isDemoUser) {
          alert(
            "Demo accounts cannot play games. Please register to continue."
          );
          return;
        }

        const res = await launchGame(
          user._id,
          game.game_uid,
          user
        );

        if (res?.url) {
          navigate("/game", {
            state: {
              url: res.url,
            },
          });
        } else if (res?.isDemoBlocked) {
          alert(
            "Demo accounts cannot play games. Please register to continue."
          );
        } else if (res?.code === 9) {
          // Hide unavailable game
          hideGame(game.game_uid);
        } else {
          alert(
            "This game is currently unavailable. Please try another."
          );
        }
      } catch (err) {
        // Hide maintenance/unavailable game
        if (err?.code === 9) {
          hideGame(game.game_uid);
          return;
        }

        console.error(
          "Game launch error:",
          err
        );

        alert(
          err?.message ||
            "Failed to launch game. Please try again."
        );
      }
    },
    [user, navigate, hideGame]
  );

  // =====================================
  // END DRAG
  // =====================================

  const endDrag = useCallback(
    (e) => {
      if (!isDraggingRef.current) return;

      isDraggingRef.current = false;
      isPausedRef.current = false;

      pointerIdRef.current = null;

      const wasTap =
        dragMovedRef.current <= 8;

      const tappedUid =
        pointerDownGameRef.current;

      pointerDownGameRef.current = null;

      if (
        e?.currentTarget &&
        e?.pointerId != null
      ) {
        try {
          e.currentTarget.releasePointerCapture(
            e.pointerId
          );
        } catch (err) {
          // Ignore
        }
      }

      // Launch game only if it was a tap
      if (
        wasTap &&
        tappedUid != null
      ) {
        const game =
          gamesRef.current.find(
            (g) =>
              String(g.game_uid) ===
              String(tappedUid)
          );

        if (game) {
          handleCardClick(game);
        }
      }

      dragMovedRef.current = 0;
    },
    [handleCardClick]
  );

  // =====================================
  // RENDER
  // =====================================

  return (
    <>
      <section className="provider-grid-root">
        <div className="provider-grid-slider">

          {/* HEADER */}

          <div className="provider-grid-header">
            <div className="provider-grid-title">
              <span className="provider-grid-icon">
                🎮
              </span>

              <span className="provider-grid-heading">
                Live Games
              </span>
            </div>

            <div className="provider-grid-actions">

              <button
                type="button"
                className="provider-nav-btn"
                onClick={() =>
                  nudge("left")
                }
              >
                ‹
              </button>

              <button
                type="button"
                className="provider-nav-btn"
                onClick={() =>
                  nudge("right")
                }
              >
                ›
              </button>

            </div>
          </div>

          {/* BODY */}

          <div className="provider-grid-viewport">

            {loading ? (
              <div className="provider-loading">
                Loading games...
              </div>
            ) : visibleGames.length === 0 ? (
              <div className="provider-loading">
                No Live games found
              </div>
            ) : (
              <div
                className="provider-grid-scroll"

                onMouseEnter={
                  handleMouseEnter
                }

                onMouseLeave={
                  handleMouseLeave
                }

                onPointerDown={
                  handlePointerDown
                }

                onPointerMove={
                  handlePointerMove
                }

                onPointerUp={endDrag}

                onPointerCancel={
                  endDrag
                }

                onPointerLeave={
                  endDrag
                }
              >

                <div
                  className="provider-grid-track"
                  ref={trackRef}
                >

                  {loopGames.map(
                    (game, idx) => {

                      const seats =
                        game.seats ??
                        game.seat_count ??
                        game.available_seats;

                      return (
                        <button
                          key={`${game.game_uid}-${idx}`}
                          type="button"
                          className="provider-grid-card"
                          data-game-uid={
                            game.game_uid
                          }
                        >

                          <div className="provider-game-image-wrap">

                            <img
                              src={game.image}
                              alt={
                                game.name ||
                                game.game_name ||
                                game.title ||
                                "Game"
                              }
                              draggable="false"

                              /*
                               * IMPORTANT:
                               * If the image URL exists but
                               * the actual image fails to load,
                               * automatically hide the game.
                               */
                              onError={() => {
                                hideGame(
                                  game.game_uid
                                );
                              }}
                            />

                            <span className="provider-live-badge">
                              <span className="provider-live-dot" />
                              LIVE
                            </span>

                            {seats != null && (
                              <span className="provider-seats-badge">
                                {seats} seats
                              </span>
                            )}

                          </div>

                          <div className="provider-game-info">

                            <div className="provider-game-name">
                              {game.name ||
                                game.game_name ||
                                game.title ||
                                "Untitled"}
                            </div>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

              </div>
            )}

          </div>
        </div>
      </section>

      <style>{`

        * {
          box-sizing: border-box;
        }

        .provider-grid-root {
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }

        .provider-grid-slider {
          width: 100%;
          overflow: hidden;
          background: #f5f5f5;
          border-radius: 10px;
          padding: 8px 10px 12px;
        }

        .provider-grid-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .provider-grid-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .provider-grid-icon {
          font-size: 18px;
        }

        .provider-grid-heading {
          font-size: 16px;
          font-weight: 600;
          color: #111;
        }

        .provider-grid-actions {
          display: flex;
          gap: 6px;
        }

        .provider-nav-btn {
          width: 28px;
          height: 28px;
          border: 0;
          border-radius: 6px;
          background: #ead9dd;
          color: #111;
          font-size: 20px;
          cursor: pointer;
        }

        .provider-grid-viewport {
          overflow: hidden;
        }

        .provider-grid-scroll {
          overflow: hidden;
          width: 100%;
          cursor: grab;

          /*
           * Allow vertical page scrolling,
           * while horizontal movement is handled
           * by the pointer handlers.
           */
          touch-action: pan-y;

          -webkit-user-select: none;
          user-select: none;
        }

        .provider-grid-scroll:active {
          cursor: grabbing;
        }

        .provider-grid-track {
          display: flex;
          gap: 10px;
          width: max-content;
          will-change: transform;
        }

        .provider-grid-card {
          position: relative;
          flex: 0 0 auto;
          width: 175px;
          border: 0;
          padding: 0;
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          background: #fff;

          box-shadow:
            0 1px 3px
            rgba(17, 17, 17, 0.08);

          text-align: left;

          transition:
            box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        .provider-grid-card:hover {
          box-shadow:
            0 6px 16px
            rgba(17, 17, 17, 0.14);

          transform: translateY(-2px);
        }

        .provider-game-image-wrap {
          position: relative;
          width: 100%;
          height: 110px;
          overflow: hidden;
          background: #000;
        }

        .provider-game-image-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;

          transition:
            transform 0.25s ease;

          pointer-events: none;
        }

        .provider-grid-card:hover
        .provider-game-image-wrap img {
          transform: scale(1.05);
        }

        .provider-live-badge {
          position: absolute;
          top: 8px;
          left: 8px;

          display: inline-flex;
          align-items: center;

          gap: 4px;

          padding:
            3px 8px 3px 6px;

          border-radius: 999px;

          background: #e5484d;

          color: #fff;

          font-size: 10px;
          font-weight: 700;

          letter-spacing: 0.3px;
        }

        .provider-live-dot {
          width: 5px;
          height: 5px;

          border-radius: 50%;

          background: #fff;
        }

        .provider-seats-badge {
          position: absolute;
          top: 8px;
          right: 8px;

          padding:
            3px 8px;

          border-radius: 999px;

          background:
            rgba(0, 0, 0, 0.55);

          color: #fff;

          font-size: 10px;
          font-weight: 600;
        }

        .provider-game-info {
          padding:
            8px 10px 10px;
        }

        .provider-game-name {
          color: #111;

          font-size: 13px;
          font-weight: 700;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .provider-game-provider {
          margin-top: 2px;

          color: #8a8f98;

          font-size: 11px;
          font-weight: 500;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .provider-loading {
          height: 120px;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #666;

          font-size: 14px;
        }

        @media (max-width: 1024px) {

          .provider-grid-card {
            width: 150px;
          }

          .provider-game-image-wrap {
            height: 92px;
          }

        }

        @media (max-width: 768px) {

          .provider-grid-card {
            width: 132px;
          }

          .provider-game-image-wrap {
            height: 80px;
          }

        }

      `}</style>
    </>
  );
};

export default ProviderGridSlider;

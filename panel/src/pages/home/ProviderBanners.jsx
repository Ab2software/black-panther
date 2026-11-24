import React from "react";
import { motion } from "framer-motion";

import betsoft from "../../assets/banners/betsoft.webp";
import betgames from "../../assets/banners/betgames.webp";
import mac88 from "../../assets/banners/mac88.webp";
import macexcite from "../../assets/banners/mac_excite.webp";
import live88 from "../../assets/banners/live88.webp";
import evoplayentertainment from "../../assets/banners/evoplay-entertainment.webp";
import gamix from "../../assets/banners/gamzix.webp";
import funGames from "../../assets/banners/fun-games.webp";
import spribe from "../../assets/banners/spribe.webp";
import kingmaker from "../../assets/banners/kingmaker.webp";

const banners = [
  {
    top: { title: "Betsoft", image: betsoft, route: "/games/game-shows" },
    bottom: { title: "Gamzix", image: gamix, route: "/games/poker" },
  },
  {
    top: { title: "Betgames.tv", image: betgames, route: "/games/live-casino" },
    bottom: {
      title: "Evolplay Entertainment",
      image: evoplayentertainment,
      route: "/games/live-casino",
    },
  },
  {
    top: { title: "Mac88 Gaming", image: mac88, route: "/games/sportsbook" },
    bottom: { title: "Fun Games", image: funGames, route: "/games/color-game" },
  },
  {
    top: { title: "Mac Excite", image: macexcite, route: "/games/casino" },
    bottom: { title: "Spribe", image: spribe, route: "/games/crash" },
  },
  {
    top: { title: "Live 88", image: live88, route: "/games/slots" },
    bottom: { title: "King Maker", image: kingmaker, route: "/games/roulette" },
  },
];


// ================= CARD =================
const BannerCard = ({ item }) => {
  return (
    <a
      href={item.route}
      className="relative h-[42px] w-[260px] sm:w-[280px] lg:w-[300px] overflow-hidden rounded-[8px] group shrink-0 bg-white"
    >
      <img
        src={item.image}
        alt={item.title}
        className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
      />
    </a>
  );
};

// ================= COLUMN =================
const BannerColumn = ({ column }) => {
  return (
    <div className="flex flex-col gap-[4px] shrink-0">
      <BannerCard item={column.top} />
      <BannerCard item={column.bottom} />
    </div>
  );
};

// ================= MAIN SECTION =================
const CasinoProvidersSection = () => {
  const loopItems = [...banners, ...banners];

  return (
    <section className="w-full bg-[#f3f3f3] py-2 overflow-hidden">
      <div className="mx-auto max-w-[2048px] px-3">
        <div className="relative h-[100px] w-full overflow-hidden">
          <motion.div
            className="absolute left-0 top-0 flex gap-[6px]"
            style={{ width: "max-content" }}
            animate={{
              x: [
                "0%",
                "-8%",
                "-16%",
                "-24%",
                "-32%",
                "-40%",
                "-50%",
              ],
            }}
            transition={{
              duration: 20,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            {loopItems.map((column, index) => (
              <BannerColumn key={index} column={column} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CasinoProvidersSection;
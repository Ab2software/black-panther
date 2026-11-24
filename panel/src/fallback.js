export const fallbackBySport = {
  cricket: [
    {
      id: "c1",
      start: Date.now() + 3600000,
      inPlay: true,
      event: { name: "RCB vs DC" },
      runners: [
        {
          name: "RCB",
          back: [{ price: 1.64, size: 2716 }],
          lay: [{ price: 1.65, size: 1488 }],
        },
        {
          name: "DC",
          back: [{ price: 2.52, size: 1820 }],
          lay: [{ price: 2.56, size: 178 }],
        },
      ],
    },
  ],

  football: [
    {
      id: "f1",
      start: Date.now() + 7200000,
      inPlay: true,
      event: { name: "Man United vs Chelsea" },
      runners: [
        {
          name: "Man United",
          back: [{ price: 2.1, size: 980 }],
          lay: [{ price: 2.12, size: 650 }],
        },
        {
          name: "Chelsea",
          back: [{ price: 3.0, size: 510 }],
          lay: [{ price: 3.05, size: 210 }],
        },
      ],
    },
  ],

  tennis: [
    {
      id: "t1",
      start: Date.now() + 10800000,
      inPlay: true,
      event: { name: "Djokovic vs Alcaraz" },
      runners: [
        {
          name: "Djokovic",
          back: [{ price: 1.75, size: 430 }],
          lay: [{ price: 1.78, size: 300 }],
        },
        {
          name: "Alcaraz",
          back: [{ price: 2.1, size: 250 }],
          lay: [{ price: 2.2, size: 190 }],
        },
      ],
    },
  ],

  basketball: [
    {
      id: "b1",
      start: Date.now() + 14400000,
      inPlay: true,
      event: { name: "Lakers vs Warriors" },
      runners: [
        {
          name: "Lakers",
          back: [{ price: 1.8, size: 600 }],
          lay: [{ price: 1.82, size: 450 }],
        },
        {
          name: "Warriors",
          back: [{ price: 2.05, size: 390 }],
          lay: [{ price: 2.1, size: 250 }],
        },
      ],
    },
  ],
};
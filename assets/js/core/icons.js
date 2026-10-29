/* VitNota - iconos vectoriales (trazo de 24x24). Sin emojis: todo icono es un SVG que hereda el color del texto. */
(function () {
  const VN = window.VN;
  const P = {
    home: 'M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z',
    cap: 'M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5',
    users: 'M9 11a4 4 0 100-8 4 4 0 000 8zM2 21a7 7 0 0114 0M17 4a4 4 0 010 7M22 21a7 7 0 00-4-6.3',
    user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0',
    book: 'M4 4h11a3 3 0 013 3v13H7a3 3 0 01-3-3zM4 17a3 3 0 013-3h11',
    check: 'M9 4h6v3H9zM6 5.5h12V21H6zM9.5 14l2 2 3.5-4',
    chart: 'M5 20v-9M12 20V4M19 20v-6',
    sliders: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
    cal: 'M4 6h16v14H4zM4 10.5h16M8 3v4M16 3v4',
    out: 'M9 4H5v16h4M16 8l4 4-4 4M20 12H9',
    search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-5-5',
    moon: 'M20 14.5A8 8 0 119.5 4a7 7 0 0010.5 10.5z',
    sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
    menu: 'M4 6h16M4 12h16M4 18h16',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    plus: 'M12 5v14M5 12h14',
    edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
    trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6',
    x: 'M6 6l12 12M18 6L6 18',
    eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 100 6 3 3 0 000-6z',
    eyeoff: 'M3 3l18 18M10.6 5.1A9.8 9.8 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 3.9M6.3 6.3A17 17 0 002 12s4 7 10 7c1.7 0 3.2-.4 4.6-1.1M9.9 9.9a3 3 0 004.2 4.2',
    alert: 'M12 3l10 18H2zM12 10v5M12 18v.5',
    info: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v6M12 7.5v.5',
    okc: 'M12 3a9 9 0 100 18 9 9 0 000-18zM8 12.5l3 3 5-6',
    download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
    upload: 'M12 16V5M7 9l5-5 5 5M5 20h14',
    refresh: 'M20 12a8 8 0 11-2.3-5.7M20 4v5h-5',
    lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 017 0v3',
    key: 'M8 14a4 4 0 100-8 4 4 0 000 8zM11 11l9 9M16 16l2-2M18 18l2-2',
    list: 'M9 4h6v3H9zM6 5.5h12V21H6zM9 12h6M9 16h6',
    file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6',
    db: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
    trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
    layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17.5l9 5 9-5',
    print: 'M7 9V3h10v6M6 17H4v-7h16v7h-2M7 14h10v7H7z',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    chevron: 'M6 9l6 6 6-6',
    copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
    save: 'M5 4h12l3 3v13H5zM8 4v5h8V4M8 20v-6h8v6',
    dot: 'M12 12.01V12'
  };
  VN.icono = (n, extra) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra ? ' ' + extra : '') + '><path d="' + (P[n] || P.dot) + '"/></svg>';
  VN.ic = VN.icono;
})();

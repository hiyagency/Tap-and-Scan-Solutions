"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import styles from "./announcement.module.css";

const messages = ["Buy 2 NFC cards, get 1 free · Add 3 to your bag", "15% off NFC stands when they launch", "Nationwide delivery", "12/6 direct support"];

export function ShopAnnouncement() {
  const [paused, setPaused] = useState(false);
  return <div className={styles.banner} role="region" aria-label="Shop announcements">
    <div className={styles.viewport}>
      <div className={styles.track} data-paused={paused}>
        {[0, 1].map(copy => <ul key={copy} className={styles.group} aria-hidden={copy === 1 ? true : undefined}>
          {messages.map(message => <li key={message}>{message}<span aria-hidden="true">✦</span></li>)}
        </ul>)}
      </div>
    </div>
    <button type="button" className={styles.control} onClick={() => setPaused(!paused)} aria-label={paused ? "Play announcements" : "Pause announcements"}>
      {paused ? <Play size={14} aria-hidden="true"/> : <Pause size={14} aria-hidden="true"/>}
    </button>
  </div>;
}

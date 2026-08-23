import Image from 'next/image';
import styles from './about.module.css';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>About</h1>
        <div className={styles.imageWrapper}>
          <Image
            src="/about-portrait.jpg"
            alt="Portrait"
            width={200}
            height={200}
            className={styles.image}
            priority
          />
        </div>
        <div className={styles.textBlock}>
          <p className={styles.text}>
            Most men buy the future. Almost none of them ever see it delivered.
          </p>
          <p className={styles.text}>
            That's the whole business. Everything else is decoration.
          </p>
          <p className={styles.text}>
            Most companies come to me knowing two things: that AI matters, and that they've been sold something they don't understand. I don't sell understanding. I build it, and then I hand it over, and then it's theirs.
          </p>
          <p className={styles.text}>
            I've taught applied AI to the Ministry of Finance. To the Ministry of Skill Development & Entrepreneurship. I've done it in front of rooms full of people who've been lied to by better-dressed men than me. Gautam Buddha University. RKGIT. Corporate floors at Innoworq Infotech and ITCS. INOX didn't want a presentation. They wanted a machine that worked when nobody was watching. So I built them one, end to end.
          </p>
          <p className={styles.text}>
            I didn't come up through code. I came up through management. I worked IT at COLT in London. I spent years in sales, which is where you learn the only thing worth knowing — that a clever man can build anything, and it means nothing until somebody in the room decides they want it.
          </p>
          <p className={styles.text}>
            So I learned to be the man in the room.
          </p>
          <p className={styles.text}>
            Four things I do: language models, generative media, web, automation. The tools change every six months. The work doesn't. The work is translation — taking something complicated and putting it where a person can use it.
          </p>
          <p className={styles.text}>
            Everyone in this industry is promising you the future.
          </p>
          <p className={styles.text}>
            I'd rather show you what your business looks like six months from now, with the right systems running quietly underneath it.
          </p>
          <p className={styles.text}>
            One conversation and you'll know whether I'm worth the room.
          </p>
        </div>
      </div>
    </main>
  );
}

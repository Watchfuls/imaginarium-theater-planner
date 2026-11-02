import {useState} from 'react';

const chapters=[
  [0,'Elements'],[30,'Blessings'],[55,'Opening Characters'],
  [150,'Guest Star Characters'],[170,'Strong/Weak Characters'],
  [290,'Important Tips & Planner'],[360,'Act 1'],[405,'Act 2'],
  [450,'Act 3'],[545,'Lunar Arcana 1'],[620,'Act 4 — Monolith'],
  [695,'Act 5'],[740,'Act 6'],[830,'Lunar Arcana 2'],
  [915,'Act 7'],[950,'Act 8'],[1055,'Act 9'],[1080,'Act 10'],
] as const;

export function VideoGuide(){
  const [chapter,setChapter]=useState({seconds:0,play:false,revision:0});
  return <section className="video-guide">
    <div className="sectionhead"><h2>Video Guide</h2><a href="https://www.youtube.com/watch?v=YqUCsZDrdZQ" target="_blank" rel="noreferrer">Watch on YouTube</a></div>
    <div className="video-guide-player"><iframe key={chapter.revision}
      title="Imaginarium Theater Video Guide by Watchful"
      src={`https://www.youtube-nocookie.com/embed/YqUCsZDrdZQ?start=${chapter.seconds}&autoplay=${chapter.play?1:0}&rel=0`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
    /></div>
    <h3>Timestamps</h3>
    <div className="video-guide-chapters">{chapters.map(([seconds,label])=><a key={seconds}
      href={`https://www.youtube.com/watch?v=YqUCsZDrdZQ&t=${seconds}s`}
      onClick={event=>{if(event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();setChapter(current=>({seconds,play:true,revision:current.revision+1}));}}
    ><span className="video-guide-time">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</span><span>{label}</span></a>)}</div>
  </section>;
}

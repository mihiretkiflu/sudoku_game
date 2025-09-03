function StatsBar({ score, mistakes, time, allTime }) {
  return (
    <div style={{ marginBottom: "10px", fontSize: "16px" }}>
      <div>Score: {score}</div>
      <div>Mistakes: {mistakes}/3</div>
      <div>Time: {time}</div>
      <div>All Time: {allTime} 🎖️</div>
    </div>
  );
}

export default StatsBar;

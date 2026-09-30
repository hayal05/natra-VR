function scheduleAtNextMidnight(name, handler) {
  function getDelayUntilMidnight() {
    const now = new Date();

    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);

    return nextMidnight.getTime() - now.getTime();
  }

  async function run() {
    try {
      await handler();
    } catch (error) {
      console.error(`[${name}] failed:`, error);
    }

    // schedule the next calendar midnight
    scheduleAtNextMidnight(name, handler);
  }

  const delay = getDelayUntilMidnight();

  console.log(
    `[${name}] scheduled for next midnight in ${Math.round(delay / 1000 / 60)} minutes`
  );

  setTimeout(run, delay);
}

module.exports = {
  scheduleAtNextMidnight,
};

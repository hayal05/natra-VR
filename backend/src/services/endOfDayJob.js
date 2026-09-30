const { closeOpenRestaurants } = require('./endOfDay');

const JOB_NAME = 'end-of-day';
const TIME_ZONE_OFFSET_MS = 3 * 60 * 60 * 1000; // GMT+03:00 East Africa Time

let timer = null;

function getMillisecondsUntilNextMidnight() {
  const now = new Date();

  // Convert current UTC time to GMT+03:00
  const eatNow = new Date(now.getTime() + TIME_ZONE_OFFSET_MS);

  // Find the next midnight in GMT+03:00
  const nextMidnightEAT = new Date(eatNow);
  nextMidnightEAT.setUTCHours(24, 0, 0, 0);

  // Convert the EAT midnight back to UTC
  const nextMidnightUTC = new Date(
    nextMidnightEAT.getTime() - TIME_ZONE_OFFSET_MS
  );

  return nextMidnightUTC.getTime() - now.getTime();
}

async function runEndOfDay() {
  try {
    const result = await closeOpenRestaurants();

    if (result.closedCount > 0) {
      console.log(
        `[endOfDay] closed ${result.closedCount} restaurant(s)`
      );
    } else {
      console.log('[endOfDay] no open restaurants to close');
    }
  } catch (error) {
    console.error('[endOfDay] failed:', error);
  }

  scheduleNextRun();
}

function scheduleNextRun() {
  const delay = getMillisecondsUntilNextMidnight();

  console.log(
    `[end-of-day] scheduled for next midnight EAT in ${Math.round(
      delay / 60000
    )} minutes`
  );

  timer = setTimeout(runEndOfDay, delay);
}

scheduleNextRun();

module.exports = {
  JOB_NAME,
  runEndOfDay,
};

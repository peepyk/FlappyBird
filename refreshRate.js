let frameTimes = [];
let lastFrameTime = performance.now();

const refreshRate = () => {
    const now = performance.now();
    const delta = now - lastFrameTime;

    lastFrameTime = now;
    frameTimes.push(delta);

    if (frameTimes.length > 50) { // Po 50 snímcích vypíše Hz a zastaví
        const avgDelta = frameTimes.reduce((accum, curr) => accum + curr, 0) / frameTimes.length; // prumer ze 50 snimku
        const refreshRate = Math.round(1000 / avgDelta);
        console.log(`Estimated Refresh Rate: ${refreshRate} Hz`);
        
        return; 
    }
    requestAnimationFrame(refreshRate);
};
requestAnimationFrame(refreshRate);
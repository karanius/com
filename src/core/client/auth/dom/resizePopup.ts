function resizePopup(window: Window) {
  const innerHeight = window.document.body.offsetHeight;

  try {
    window.resizeTo(
      800,
      innerHeight + window.outerHeight - window.innerHeight + 10
    );
  } catch {
    // Ignore occasional errors in older browsers.
  }
}

let resizedAlready = false;
export default function resizeOncePerFrame(window: Window) {
  if (resizedAlready) {
    return;
  }
  resizedAlready = true;
  requestAnimationFrame(() => setTimeout(() => (resizedAlready = false), 0));
  resizePopup(window);
}

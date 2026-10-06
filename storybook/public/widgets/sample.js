export default function decorate(widget) {
  const status = widget.querySelector('[data-widget-status]');
  const refresh = widget.querySelector('button');
  const update = () => {
    status.textContent = `All systems operational · ${new Date().toLocaleTimeString()}`;
  };
  refresh.addEventListener('click', update);
  update();
}

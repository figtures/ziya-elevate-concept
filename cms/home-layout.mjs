/** Arrange already-bound homepage content without changing CMS field identities. */
export function applyHomeLayout(document, route) {
  if (route !== '/') return;
  const wrap = document.querySelector('.ed-home-books > .wrap');
  if (!wrap) return;
  const heading = wrap.querySelector(':scope > .ed-heading, :scope > .home-books-heading > .ed-heading');
  const action = wrap.querySelector(':scope > a.ed-link, :scope > .home-books-heading > a.ed-link');
  if (!heading || !action) return;
  let row = wrap.querySelector(':scope > .home-books-heading');
  if (!row) {
    row = document.createElement('div');
    row.className = 'home-books-heading';
    heading.before(row);
  }
  row.append(heading, action);
  const note = wrap.querySelector(':scope > .depth-note');
  if (note) heading.append(note);
}

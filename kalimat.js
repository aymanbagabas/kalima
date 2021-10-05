import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import Fuse from 'fuse.js'
import DB from './fnanendb.json'
import _ from 'lodash'

const fnanendb = 'https://github.com/aymanbagabas/fnanendb/raw/master/fnanendb.json'

fetch(fnanendb).then(db => {
  if (!db.ok) {
    console.error('Failed to load fnanendb.json')
  }
  return Cache.put(fnanendb, db)
})

const fuseOptions = {
  shouldSort: true,
  threshold: 0.3,
  includeScore: true
}

window.DB = DB
window.db = Object.keys(DB).map(artist => DB[artist].map(song => ({ ...song, artist }))).flat(1)

function keyForField (field) {
  switch (field) {
    case 'artists': return 'artist'
    case 'composers': return 'composer'
    case 'titles': return 'title'
    case 'authors': return 'author'
    case 'lyrics': return 'lyrics'
    default: return field
  }
}

function dbForField (field) {
  function get () {
    switch (field) {
      case 'artists': return window.db.map(song => song.artist)
      case 'composers': return window.db.map(song => song.composer)
      case 'titles': return window.db.map(song => ({ title: song.title, artist: song.artist }))
      case 'authors': return window.db.map(song => song.author)
      case 'lyrics':
      default:
        return window.db
    }
  }
  return Array.from(new Set(get() || []))
}

export function setQuery (q) {
  if (history.pushState) {
    const newurl = window.location.protocol + '//' + window.location.host + window.location.pathname + q
    const contentEl = document.getElementById('content')
    window.history.pushState({ content: contentEl.innerHTML, path: newurl }, '', newurl)
  }
}

export function search (e) {
  if (e.preventDefault) {
    e.preventDefault()
  }
  const searchTextEl = document.getElementById('searchText')
  const searchText = searchTextEl.value
  const fields = ['artists', 'composers', 'titles', 'authors', 'lyrics']
  const resultsEl = document.getElementById('content')

  setQuery(`?search=${searchText}`)
  resultsEl.innerHTML = ''
  fields.forEach(field => {
    const checkEl = document.getElementById(`${field}Check`)
    if (checkEl.checked) {
      const db = dbForField(field)
      const fuse = new Fuse(db, {
        ...fuseOptions,
        keys: [keyForField(field)]
      })
      const results = fuse.search(searchText, { limit: 100 })
      if (results.length === 0) return

      resultsEl.innerHTML += `
    <div class="accordion" id="${field}">
    <div class="card" id="${field}Card">
      <div class="card-header" id="${field}Heading">
        <h5 class="mb-0">
          <button class="btn btn-link" type="button" data-bs-toggle="collapse" data-bs-target="#${field}Collapse"
            aria-expanded="true" aria-controls="${field}Collapse">
            ${_.startCase(field)}
          </button>
        </h5>
      </div>

      <div id="${field}Collapse" class="collapse show" aria-labelledby="${field}Heading" data-parent="#${field}">
        <ul>
          ${results.map(result => {
            const { item } = result
            function content () {
              switch (field) {
                case 'artists':
                  return `<button onclick="Kalimat.setQuery('?artist=${item}');Kalimat.init()" class="btn btn-link" type="button">${item}</button>`
                case 'composers':
                  return `<button onclick="Kalimat.setQuery('?composer=${item}');Kalimat.init()" class="btn btn-link" type="button">${item}</button>`
                case 'lyrics':
                case 'titles':
                  return `<button onclick="Kalimat.setQuery('?artist=${item.artist}&title=${item.title}');Kalimat.init()" class="btn btn-link" type="button">${item.artist} - ${item.title}</button>`
                case 'authors':
                  return `<button onclick="Kalimat.setQuery('?author=${item}');Kalimat.init()" class="btn btn-link" type="button">${item}</button>`
              }
            }
            return `<li>${content()}</li>`
          }).join('')}
        </ul>
      </div>
    </div>
  </div>

    `
    }
  })
}

export function init () {
  const params = new URLSearchParams(location.search)
  const contentEl = document.getElementById('content')
  contentEl.innerHTML = ''

  if (params.has('search')) {
    const form = document.getElementById('searchForm')
    const searchText = params.get('search')
    const searchTextEl = document.getElementById('searchText')
    searchTextEl.value = searchText
    search(form)
  } else if (params.has('artist') && params.has('title')) {
    const title = params.get('title')
    const artist = params.get('artist')
    const song = window.db.find(song => song.title === title && song.artist === artist)
    contentEl.innerHTML = `
    <div class="card">
      <h5 class="card-header">
        ${artist} - ${title}
      </h5>
      <div class="card-body">
        <p class="card-text" style="white-space: pre;">${song.lyrics}</p>
        ${song.author ? `<p class="card-text"><small class="text-muted"><b>Author:</b> <span onclick="Kalimat.setQuery('?author=${song.author}');Kalimat.init()" style="text-decoration:underline;cursor:pointer;">${song.author}</span></small></p>` : ''}
        ${song.composer ? `<p class="card-text"><small class="text-muted"><b>Composer:</b> <span onclick="Kalimat.setQuery('?composer=${song.composer}');Kalimat.init()" style="text-decoration:underline;cursor:pointer;">${song.composer}</span></small></p>` : ''}
        ${song.date ? `<p class="card-text"><small class="text-muted"><b>Date:</b> ${song.date}</small></p>` : ''}
      </div>
    </div>

    `
  } else if (params.has('composer')) {
    const composer = params.get('composer')
    contentEl.innerHTML = `
    <div class="card">
      <h5 class="card-header">${composer}</h5>
      <div class="card-body">
        <div class="card-text">
          <ul>
            ${window.db.filter(song => song.composer === composer).map(song => `<li><button onclick="Kalimat.setQuery('?artist=${song.artist}&title=${song.title}');Kalimat.init()" class="btn btn-link" type="button">${song.artist} - ${song.title}</button></li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    `
  } else if (params.has('artist')) {
    const artist = params.get('artist')
    contentEl.innerHTML = `
    <div class="card">
      <h5 class="card-header">${artist}</h5>
      <div class="card-body">
        <div class="card-text">
          <ul>
            ${window.db.filter(song => song.artist === artist).map(song => `<li><button onclick="Kalimat.setQuery('?artist=${song.artist}&title=${song.title}');Kalimat.init()" class="btn btn-link" type="button">${song.artist} - ${song.title}</button></li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    `
  } else if (params.has('author')) {
    const author = params.get('author')
    contentEl.innerHTML = `
    <div class="card">
      <h5 class="card-header">${author}</h5>
      <div class="card-body">
        <div class="card-text">
          <ul>
            ${window.db.filter(song => song.author === author).map(song => `<li><button onclick="Kalimat.setQuery('?artist=${song.artist}&title=${song.title}');Kalimat.init()" class="btn btn-link" type="button">${song.artist} - ${song.title}</button></li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    `
  }

  // save state
  setQuery(location.search)
}

window.addEventListener('popstate', (event) => {
  const contentEl = document.getElementById('content')
  const { state } = event
  contentEl.innerHTML = state.content
})

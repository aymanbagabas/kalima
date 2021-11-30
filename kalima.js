import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'
import Fuse from 'fuse.js'
// import DB from './fnanendb.json'
import _, { startCase } from 'lodash'

// const fnanendb = 'https://github.com/aymanbagabas/fnanendb/raw/master/fnanendb.js'

// fetch(fnanendb).then(db => {
//   if (!db.ok) {
//     console.error('Failed to load fnanendb.json')
//   }
//   return Cache.put(fnanendb, db)
// })

const fields = ['artists', 'composers', 'titles', 'lyricists', 'lyrics']

const fuseOptions = {
  shouldSort: true,
  threshold: 0.3,
  includeScore: true
}

// window.DB = DB
window.db = Object.keys(window.DB).map(artist => window.DB[artist].map(song => ({ ...song, artist }))).flat(1)

function keyForField (field) {
  switch (field) {
    case 'artists': return 'artist'
    case 'composers': return 'composer'
    case 'titles': return 'title'
    case 'lyricists': return 'lyricist'
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
      case 'lyricists': return window.db.map(song => song.lyricist)
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
                  return `<button onclick="Kalima.setQuery('?artist=${item}');Kalima.init()" class="btn btn-link" type="button">${item}</button>`
                case 'composers':
                  return `<button onclick="Kalima.setQuery('?composer=${item}');Kalima.init()" class="btn btn-link" type="button">${item}</button>`
                case 'lyrics':
                case 'titles':
                  return `<button onclick="Kalima.setQuery('?artist=${item.artist}&title=${item.title}');Kalima.init()" class="btn btn-link" type="button">${item.artist} - ${item.title}</button>`
                case 'lyricists':
                  return `<button onclick="Kalima.setQuery('?lyricist=${item}');Kalima.init()" class="btn btn-link" type="button">${item}</button>`
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
  const formContainerEl = document.getElementById('searchFormContainer')
  formContainerEl.innerHTML = fields.map(f => {
    return `
    <div class="form-check form-check-inline">
      <input class="form-check-input" type="checkbox" value="" id="${f}Check" checked>
      <label class="form-check-label" for="${f}Check">
        ${startCase(f)}
      </label>
    </div>
    `
  }).join('\n')

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
      <h5 class="card-header text-center">
        ${artist} - ${title}
      </h5>
      <div class="card-body">
        <p class="card-text text-center" style="white-space: pre;">${song.lyrics}</p>
        ${song.lyricist ? `<p class="card-text text-center"><small class="text-muted"><b>Lyricist:</b> <span onclick="Kalima.setQuery('?lyricist=${song.lyricist}');Kalima.init()" style="text-decoration:underline;cursor:pointer;">${song.lyricist}</span></small></p>` : ''}
        ${song.composer ? `<p class="card-text text-center"><small class="text-muted"><b>Composer:</b> <span onclick="Kalima.setQuery('?composer=${song.composer}');Kalima.init()" style="text-decoration:underline;cursor:pointer;">${song.composer}</span></small></p>` : ''}
        ${song.date ? `<p class="card-text text-center"><small class="text-muted"><b>Date:</b> ${song.date}</small></p>` : ''}
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
            ${window.db.filter(song => song.composer === composer).map(song => `<li><button onclick="Kalima.setQuery('?artist=${song.artist}&title=${song.title}');Kalima.init()" class="btn btn-link" type="button">${song.artist} - ${song.title}</button></li>`).join('')}
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
            ${window.db.filter(song => song.artist === artist).map(song => `<li><button onclick="Kalima.setQuery('?artist=${song.artist}&title=${song.title}');Kalima.init()" class="btn btn-link" type="button">${song.artist} - ${song.title}</button></li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    `
  } else if (params.has('lyricist')) {
    const lyricist = params.get('lyricist')
    contentEl.innerHTML = `
    <div class="card">
      <h5 class="card-header">${lyricist}</h5>
      <div class="card-body">
        <div class="card-text">
          <ul>
            ${window.db.filter(song => song.lyricist === lyricist).map(song => `<li><button onclick="Kalima.setQuery('?artist=${song.artist}&title=${song.title}');Kalima.init()" class="btn btn-link" type="button">${song.artist} - ${song.title}</button></li>`).join('')}
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

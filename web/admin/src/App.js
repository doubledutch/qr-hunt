/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { Component } from 'react'
import './App.css'

import client from '@doubledutch/admin-client'
import Avatar from './Avatar'
import FirebaseConnector from '@doubledutch/firebase-connector'
const fbc = FirebaseConnector(client, 'qrhunt')

fbc.initializeAppWithSimpleBackend()

//const publicUsersRef = () => fbc.database.public.usersRef()
const adminableUsersRef = () => fbc.database.private.adminableUsersRef()
const categoriesRef = () => fbc.database.public.adminRef('categories')
const codesRef = () => fbc.database.public.adminRef('codes')

export default class App extends Component {
  state = {
    attendees: [],
    admins: [],
    categories: [],
    codes: [],
  }

  componentDidMount() {
    fbc.signinAdmin()
    .then(user => {
      client.getUsers().then(attendees => {
        this.setState({attendees: attendees.sort(sortPlayers)})

        adminableUsersRef().on('value', data => {
          const users = data.val() || {}
          this.setState({admins: Object.keys(users).filter(id => users[id].adminToken)})
        })
      })

      const onChildAdded = (stateProp, sort) => data => this.setState(state => ({[stateProp]: [...state[stateProp], {...data.val(), id: data.key}].sort(sort)}))
      const onChildChanged = (stateProp, sort) => data => this.setState(state => ({[stateProp]: [...state[stateProp].filter(x => x.id !== data.key), {...data.val(), id: data.key}].sort(sort)}))
      const onChildRemoved = stateProp => data => this.setState(state => ({[stateProp]: state[stateProp].filter(c => c.id !== data.key)}))

      categoriesRef().on('child_added', onChildAdded('categories', sortByName))
      categoriesRef().on('child_changed', onChildChanged('categories', sortByName))
      categoriesRef().on('child_removed', onChildRemoved('categories'))

      codesRef().on('child_added', onChildAdded('codes', sortByName))
      codesRef().on('child_changed', onChildChanged('codes', sortByName))
      codesRef().on('child_removed', onChildRemoved('codes'))
    })
  }

  render() {
    const {attendees, categories, codes} = this.state
    return (
      <div className="App">
        { attendees
          ? <div>
              <h2>QR Code Categories <button onClick={this.newCategory} className="add">Add New</button></h2>
              <ul className="categoryList">
                { categories.map(this.renderCategory) }
              </ul>

              <h2>QR Codes</h2>
              <span>(Attendees marked as admins can add new codes from the app)</span>
              <ul className="qrCodeList">
                { codes.map(this.renderCode) }
              </ul>

              <h2>Attendees</h2>
              <ul className="userList">
                { attendees.map(this.renderUser) }
              </ul>
            </div>
          : <div>Loading...</div>
        }
      </div>
    )
  }

  renderCategory = category => {
    const { id, name } = category
    return (
      <li key={id}>
        <button className="remove" onClick={this.removeCategory(category)}>Remove</button>&nbsp;
        <input type="text" value={name} placeholder="Category Name" onChange={e => categoriesRef().child(id).child('name').set(e.target.value)} />
      </li>
    )
  }

  renderCode = code => {
    const { categoryId, id, name, value } = code
    return (
      <li key={id}>
        <button className="remove" onClick={this.removeCode(code)}>Remove</button>&nbsp;
        <input type="text" value={name} placeholder="QR Code Name" onChange={e => codesRef().child(id).child('name').set(e.target.value)} />&nbsp;
        <select value={categoryId} onChange={e => codesRef().child(id).child('categoryId').set(e.target.value)}>
          { this.state.categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>) }
        </select>
        <span className="payload" title={value}>{value}</span>
      </li>
    )
  }

  renderUser = user => {
    const { id, firstName, lastName } = user
    return (
      <li key={id}>
        <Avatar user={user} size={30} />
        <span> {firstName} {lastName}</span>
        { this.isAdmin(id)
            ? <button className="remove" onClick={()=>this.setAdmin(id, false)}>Remove admin</button>
            : <button className="add" onClick={()=>this.setAdmin(id, true)}>Make admin</button>
        }
      </li>
    )
  }

  newCategory = () => {
    categoriesRef().push({name: 'New QR Code Category'})
  }

  removeCategory = category => () => {
    if (window.confirm(`Are you sure you want to remove the QR code category '${category.name}'?`)) {
      categoriesRef().child(category.id).remove()
    }
  }

  removeCode = code => () => {
    if (window.confirm(`Are you sure you want to remove the QR code '${code.name}'?`)) {
      codesRef().child(code.id).remove()
    }
  }

  isAdmin(id) {
    return this.state.admins.includes(id)
  }

  setAdmin(userId, isAdmin) {
    const tokenRef = fbc.database.private.adminableUsersRef(userId).child('adminToken')
    if (isAdmin) {
      this.setState()
      fbc.getLongLivedAdminToken().then(token => tokenRef.set(token))
    } else {
      tokenRef.remove()
    }
  }

  markComplete(task) {
    fbc.database.public.allRef('tasks').child(task.key).remove()
  }
}

function sortPlayers(a, b) {
  const aFirst = (a.firstName || '').toLowerCase()
  const bFirst = (b.firstName || '').toLowerCase()
  const aLast = (a.lastName || '').toLowerCase()
  const bLast = (b.lastName || '').toLowerCase()
  if (aFirst !== bFirst) return aFirst < bFirst ? -1 : 1
    return aLast < bLast ? -1 : 1
}

function sortByName(a, b) {
  return (a.name || '').toLowerCase() < (b.name || '').toLowerCase() ? -1 : 1
}
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
const categoriesRef = () => fbc.database.public.adminRef()

export default class App extends Component {
  state = {
    attendees: [],
    admins: [],
    categories: []
  }

  componentDidMount() {
    fbc.signinAdmin()
    .then(user => {
      client.getUsers().then(attendees => {
        this.setState({attendees: attendees.sort(sortPlayers)})
        // publicUsersRef().on('child_added', data => {
        //   var player = attendees.find(a => a.id === data.key)
        //   if (player){
        //     this.setState(state => ({players: [...state.players, {...data.val(), id: data.key}].sort(sortPlayers)}))
        //   }
        // })
        // publicUsersRef().on('child_removed', data => {
        //   this.setState(state => ({players: state.players.filter(p => p.id !== data.key)}))
        // })

        adminableUsersRef().on('value', data => {
          const users = data.val() || {}
          this.setState({admins: Object.keys(users).filter(id => users[id].adminToken)})
        })
      })

      categoriesRef().on('child_added', data => {
        this.setState(state => ({categories: [...state.categories, {...data.val(), id: data.key}].sort(sortCategories)}))
      })
      categoriesRef().on('child_changed', data => {
        this.setState(state => ({categories: [...state.categories.filter(c => c.id !== data.key), {...data.val(), id: data.key}].sort(sortCategories)}))
      })
      categoriesRef().on('child_removed', data => {
        this.setState(state => ({categories: state.categories.filter(c => c.id !== data.key)}))
      })
    })
  }

  render() {
    const {attendees, categories} = this.state
    return (
      <div className="App">
        { attendees
          ? <div>
              <h2>QR Code Categories <button onClick={this.newCategory} className="add">Add New</button></h2>
              <ul className="categoryList">
                { categories.map(this.renderCategory) }
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
        <input type="text" value={name} placeholder="Category Name" onChange={e => categoriesRef().child(category.id).child('name').set(e.target.value)} />
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

function sortCategories(a, b) {
  return (a.name || '').toLowerCase() < (b.name || '').toLowerCase() ? -1 : 1
}
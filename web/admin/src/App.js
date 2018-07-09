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
import {CSVLink} from 'react-csv'
import '@doubledutch/react-components/lib/base.css'
import './App.css'
import {AttendeeSelector, TextInput} from '@doubledutch/react-components'
import CategoryCell from "./CategoryCell"
import CodeCell from "./CodeCell"
import client from '@doubledutch/admin-client'
import Avatar from './Avatar'
import FirebaseConnector from '@doubledutch/firebase-connector'
const fbc = FirebaseConnector(client, 'qrhunt')

fbc.initializeAppWithSimpleBackend()

const adminableUsersRef = () => fbc.database.private.adminableUsersRef()
const categoriesRef = () => fbc.database.public.adminRef('categories')
const codesRef = () => fbc.database.public.adminRef('codes')
const doneDescriptionRef = () => fbc.database.public.adminRef('doneDescription')
const welcomeRef = () => fbc.database.public.adminRef('welcome')
const titleRef = () => fbc.database.public.adminRef('title')

export default class App extends Component {
  state = {
    attendees: [],
    admins: [],
    categories: [],
    codes: [],
    doneDescription: '',
    title: '',
    welcome: '',
    scansPerUserPerCategory: {},
    isTitleBoxDisplay : true,
    isCategoryBoxDisplay: true,
    isCodeBoxDisplay: true,
    isAdminBoxDisplay: true,
    isAttendeeBoxDisplay: true
  }

  componentDidMount() {
    fbc.signinAdmin()
    .then(user => {
      client.getUsers().then(attendees => {
        this.setState({attendees})
      })

      doneDescriptionRef().on('value', data => this.setState({doneDescription: data.val()}))
      welcomeRef().on('value', data => this.setState({welcome: data.val()}))
      titleRef().on('value', data => this.setState({title: data.val()}))

      const onChildAdded = (stateProp, sort) => data => this.setState(state => ({[stateProp]: [...state[stateProp], {...data.val(), id: data.key}].sort(sort)}))
      const onChildChanged = (stateProp, sort) => data => this.setState(state => ({[stateProp]: [...state[stateProp].filter(x => x.id !== data.key), {...data.val(), id: data.key}].sort(sort)}))
      const onChildRemoved = stateProp => data => this.setState(state => ({[stateProp]: state[stateProp].filter(c => c.id !== data.key)}))

      categoriesRef().on('child_added', onChildAdded('categories', sortByName))
      categoriesRef().on('child_changed', onChildChanged('categories', sortByName))
      categoriesRef().on('child_removed', onChildRemoved('categories'))

      codesRef().on('child_added', onChildAdded('codes', sortByName))
      codesRef().on('child_changed', onChildChanged('codes', sortByName))
      codesRef().on('child_removed', onChildRemoved('codes'))

      adminableUsersRef().on('value', data => {
        const users = data.val() || {}
        this.setState(state => {
          const codeToCategory = state.codes.reduce((ctc, code) => { ctc[code.id] = code.categoryId; return ctc }, {})
          return {
            admins: Object.keys(users).filter(id => users[id].adminToken),
            scansPerUserPerCategory: Object.keys(users).reduce((spupc, userId) => {
              spupc[userId] = Object.keys(users[userId].scans || {}).map(scannedId => codeToCategory[scannedId]).reduce((countPerCat, catId) => {
                if (catId) countPerCat[catId] = (countPerCat[catId] || 0) + 1
                return countPerCat
              }, {})
              return spupc
            }, {})
          }
        })
      })
    })
  }

  handleChange = (name, value) => {
    this.setState({[name]: value});
  }

  renderTitleBox = () => {
    if (this.state.isTitleBoxDisplay) {
      const {doneDescription, title, welcome} = this.state
      return (
        <div>
          <TextInput label="Title"
                     value={title}
                     onChange={e => titleRef().set(e.target.value)}
                     placeholder="Ex. QR Challenge"
                     className="titleText" />
          <div className="containerRow">
            <div className="field half">
              <TextInput multiline label="Game Instructions for Attendees"
                         placeholder="Ex. Scan 3 codes in each category and be entered into the raffle!"
                         value={welcome}
                         onChange={e => welcomeRef().set(e.target.value)}
                         maxLength={500}
                         className="welcomeText" />
            </div>
            <div className="field half">
              <TextInput multiline label="Message to Attendee When Complete"
                         placeholder="Ex. You're now entered into the raffle!"
                         value={doneDescription}
                         onChange={e => welcomeRef().set(e.target.value)}
                         maxLength={500}
                         className="completeText" />
            </div>
          </div>
        </div>
      )
    }
  }

  renderCatBox = (categories) => {
    if (this.state.isCategoryBoxDisplay) {
      return (
        <div>
          <div className="titleBar"><p>Name</p><p>Scans Required</p></div>
          <ul className="categoryList">
            { categories.map(category => {
              return <CategoryCell key={category.id} category={category} setCatName={this.setCatName} setCatNumb={this.setCatNumb} removeCategory={this.removeCategory}/>
            } 
            )}              
          </ul>
        </div>
      )
    }
  }

  renderCodeBox = (codes, categories) => {
    if (this.state.isCodeBoxDisplay) {
      return (
        <div>
          <div className="titleBar"><p>Name</p><p>Category</p></div>
          <ul className="qrCodeList">
            { codes.map(code => {
              return <CodeCell key={code.id} code={code} setCodeName={this.setCodeName} setCodeNumb={this.setCodeNumb} removeCode={this.removeCode} categories={categories}/>
            }
            )}
          </ul>
        </div>
      )
    }
  }

  render() {
    const {attendees, categories, codes} = this.state
    return (
      <div className="App">
        { attendees
          ? <div>
              <div className="sectionContainer">
                <div className="containerRow">
                  <h2>QR Hunt</h2>
                  <button className="displayButton" onClick={() => this.handleChange("isTitleBoxDisplay", !this.state.isTitleBoxDisplay)}>{(this.state.isTitleBoxDisplay ? "Hide Section" : "View Section")}</button>
                </div>
                {this.renderTitleBox()}
              </div>

              <div className="sectionContainer">
                <div className="containerRow">
                  <div className="containerRow horizontal space-children">
                    <h2>QR Code Categories</h2>
                    <button onClick={this.newCategory} className="secondary">Add Category</button>
                  </div>
                  <button className="displayButton" onClick={() => this.handleChange("isCategoryBoxDisplay", !this.state.isCategoryBoxDisplay)}>{(this.state.isCategoryBoxDisplay ? "Hide Section" : "View Section")}</button>
                </div>
                {this.renderCatBox(categories)}
              </div>

              <div className="sectionContainer">
                <div className="containerRow">
                  <h2>Admins</h2>
                  <button className="displayButton" onClick={() => this.handleChange("isAdminBoxDisplay", !this.state.isAdminBoxDisplay)}>{(this.state.isAdminBoxDisplay ? "Hide Section" : "View Section")}</button>
                </div>
                {this.state.isAdminBoxDisplay ? <AttendeeSelector client={client}
                                  searchTitle="Select Admins"
                                  selectedTitle="Current Admins"
                                  onSelected={this.onAdminSelected}
                                  onDeselected={this.onAdminDeselected}
        selected={attendees.filter(a => this.isAdmin(a.id))} /> : null}
              </div>
              
              <div className="sectionContainer">
                <div className="containerRow">
                  <h2>QR Codes</h2>
                  <button className="displayButton" onClick={() => this.handleChange("isCodeBoxDisplay", !this.state.isCodeBoxDisplay)}>{(this.state.isCodeBoxDisplay ? "Hide Section" : "View Section")}</button>
                </div>
                {this.renderCodeBox(codes, categories)}
              </div>

              <div className="sectionContainer">
                <div className="containerRow">
                  <h2>Attendees</h2>
                  <button className="displayButton" onClick={() => this.handleChange("isAttendeeBoxDisplay", !this.state.isAttendeeBoxDisplay)}>{(this.state.isAttendeeBoxDisplay ? "Hide Section" : "View Section")}</button>
                </div>

                {this.state.isAttendeeBoxDisplay ? <div>
                  <CSVLink className="csvButton" data={this.state.attendees.filter(a => this.isDone(a.id))} filename={"attendees-completed.csv"}>Export completed attendees to CSV</CSVLink>
                  <ul className="userList">
                    { attendees.sort(this.sortPlayers).map(this.renderUser) }
                  </ul>
                </div> : null}
              </div>
            </div>
          : <div>Loading...</div>
        }
      </div>
    )
  }

  onAdminSelected = attendee => {
    const tokenRef = fbc.database.private.adminableUsersRef(attendee.id).child('adminToken')
    this.setState()
    fbc.getLongLivedAdminToken().then(token => tokenRef.set(token))
  }
  onAdminDeselected = attendee => {
    const tokenRef = fbc.database.private.adminableUsersRef(attendee.id).child('adminToken')
    tokenRef.remove()
  }

  setCatName = (id, e) => {
    categoriesRef().child(id).child('name').set(e.target.value)
  }

  setCatNumb = (id, e) => {
    categoriesRef().child(id).child('scansRequired').set(+e.target.value)
  }

  setCodeName = (id, e) => {
    codesRef().child(id).child('name').set(e.target.value)
  }

  setCodeNumb = (id, e) => {
    codesRef().child(id).child('categoryId').set(e.target.value)
  }

  renderUser = user => {
    const { id, firstName, lastName } = user
    return (
      <li key={id} className={this.isDone(user.id) ? 'is-done' : 'not-done'}>
        <Avatar user={user} size={30} />
        <span className="name"> {firstName} {lastName}</span>
        { this.state.categories.map(cat => <span className="catScans" key={cat.id}>
            {cat.name}: {this.categoryScansForUser(cat.id, user.id)}
          </span>)
        }
      </li>
    )
  }

  categoryScansForUser = (categoryId, userId) => (this.state.scansPerUserPerCategory[userId] || {})[categoryId] || 0
  isDone = userId => !!this.state.categories.length && !this.state.categories.find(cat => this.categoryScansForUser(cat.id, userId) < (cat.scansRequired || 0))

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

  sortPlayers = (a, b) => {
    const isADone = this.isDone(a.id)
    const isBDone = this.isDone(b.id)
    if (isADone !== isBDone) return isADone ? -1 : 1

    const aFirst = (a.firstName || '').toLowerCase()
    const bFirst = (b.firstName || '').toLowerCase()
    const aLast = (a.lastName || '').toLowerCase()
    const bLast = (b.lastName || '').toLowerCase()
    if (aFirst !== bFirst) return aFirst < bFirst ? -1 : 1
      return aLast < bLast ? -1 : 1
  }  
}

function sortByName(a, b) {
  return (a.name || '').toLowerCase() < (b.name || '').toLowerCase() ? -1 : 1
}
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

import React, { PureComponent } from 'react'
import {CSVDownload} from 'react-csv'
import client, {translate as t, useStrings} from '@doubledutch/admin-client'
import i18n from './i18n'
import '@doubledutch/react-components/lib/base.css'
import './App.css'
import CategoryCell from "./CategoryCell"
import CodeCell from "./CodeCell"
import SearchBar from "./SearchBar"
import {AttendeeSelector, Avatar, TextInput} from '@doubledutch/react-components'
import {provideFirebaseConnectorToReactComponent} from '@doubledutch/firebase-connector'

useStrings(i18n)

class App extends PureComponent {
  adminableUsersRef = () => this.props.fbc.database.private.adminableUsersRef()
  categoriesRef = () => this.props.fbc.database.public.adminRef('categories')
  codesRef = () => this.props.fbc.database.public.adminRef('codes')
  doneDescriptionRef = () => this.props.fbc.database.public.adminRef('doneDescription')
  welcomeRef = () => this.props.fbc.database.public.adminRef('welcome')
  titleRef = () => this.props.fbc.database.public.adminRef('title')
  
  state = {
    attendees: [],
    updatedList: [],
    admins: [],
    categories: [],
    codes: [],
    doneDescription: '',
    title: '',
    welcome: '',
    allCodesByUser: {},
    scansPerUserPerCategory: {},
    isTitleBoxDisplay : true,
    isCategoryBoxDisplay: true,
    isCodeBoxDisplay: true,
    isAdminBoxDisplay: true,
    isAttendeeBoxDisplay: true,
    attendeeSearch: true,
    attendeeSearchValue: "",
    activeEdit: "",
    exportList: [],
    exporting: false,
    exportListCode: [],
    exportingCode: false
  }

  componentDidMount() {
    this.props.fbc.signinAdmin()
    .then(() => {
      client.getAttendees().then(attendees => {
        this.setState({attendees})
      })

      this.doneDescriptionRef().on('value', data => this.setState({doneDescription: data.val()}))
      this.welcomeRef().on('value', data => this.setState({welcome: data.val()}))
      this.titleRef().on('value', data => this.setState({title: data.val()}))

      const onChildAdded = (stateProp, sort) => data => this.setState(state => ({[stateProp]: [...state[stateProp], {...data.val(), id: data.key}].sort(sort)}))
      const onChildChanged = (stateProp, sort) => data => this.setState(state => ({[stateProp]: [...state[stateProp].filter(x => x.id !== data.key), {...data.val(), id: data.key}].sort(sort)}))
      const onChildRemoved = stateProp => data => this.setState(state => ({[stateProp]: state[stateProp].filter(c => c.id !== data.key)}))

      this.categoriesRef().on('child_added', onChildAdded('categories', sortByName))
      this.categoriesRef().on('child_changed', onChildChanged('categories', sortByName))
      this.categoriesRef().on('child_removed', onChildRemoved('categories'))

      this.codesRef().on('child_added', onChildAdded('codes', sortByName))
      this.codesRef().on('child_changed', onChildChanged('codes', sortByName))
      this.codesRef().on('child_removed', onChildRemoved('codes'))

      this.adminableUsersRef().on('value', data => {
        this.setState({allCodesByUser: data.val()})
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
          <p className="boxDescription">{t("instructions")}</p>
          <TextInput label={t("title")}
                     value={title}
                     onChange={e => this.titleRef().set(e.target.value)}
                     placeholder={t("exampleTitle")}
                     maxLength={50}
                     className="titleText" />
          <div className="containerRow">
            <div className="field half">
              <TextInput multiline label={t("instructionsTitle")}
                         placeholder={t("instructionsExample")}
                         value={welcome}
                         onChange={e => this.welcomeRef().set(e.target.value)}
                         maxLength={250}
                         className="welcomeText" />
            </div>
            <div className="field half">
              <TextInput multiline label={t("completionTitle")}
                         placeholder={t("completionExample")}
                         value={doneDescription}
                         onChange={e => this.doneDescriptionRef().set(e.target.value)}
                         maxLength={250}
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
          <div className="titleBar"><p>{t("name")}</p><p>{t("description")}</p><p>{t("scansRequired")}</p></div>
          <ul className="categoryList">
            { categories.map(category => {
              return <CategoryCell categories={categories} codes={this.state.codes} key={category.id} isHidden={!this.state.isCategoryBoxDisplay} setCurrentEdit={this.setCurrentEdit} activeEdit={this.state.activeEdit} category={category} setCatName={this.setCatName} setCatDes={this.setCatDes} setCatNumb={this.setCatNumb} removeCategory={this.removeCategory}/>
            } 
            )}
            {categories.length ? null : <h2 className="emptyBoxText">{t("noCats")}</h2>}              
          </ul>
        </div>
      )
    }
  }


  renderCodeBox = (codes, categories) => {
    if (this.state.isCodeBoxDisplay) {
      return (
        <div>
          <div className="titleBar"><p>{t("name")}</p><p>{t("category")}</p></div>
          <ul className="qrCodeList">
            { codes.map(code => {
              return <CodeCell key={code.id} code={code} codes={this.state.codes} isHidden={!this.state.isCodeBoxDisplay} setCurrentEdit={this.setCurrentEdit} activeEdit={this.state.activeEdit} setCodeName={this.setCodeName} resetCodeName={this.resetCodeName} setCodeNumb={this.setCodeNumb} removeCode={this.removeCode} categories={categories}/>
            }
            )}
            {codes.length ? null : <h2 className="emptyBoxText">{t("noCodes")}</h2>}    
          </ul>
        </div>
      )
    }
  }

  render() {
    const {codes, categories} = this.state
    const attendees = this.getCustomAttendeeList()

    return (
      <div className="App">
        { attendees
          ? <div>
              <div className="sectionContainer">
                <div className="containerRow">
                  <h2 className="titleWithDescription">QR Hunt</h2>
                  <button className="displayButton" onClick={() => this.handleChange("isTitleBoxDisplay", !this.state.isTitleBoxDisplay)}>{(this.state.isTitleBoxDisplay ? t("hideSection") : t("viewSection"))}</button>
                </div>
                {this.renderTitleBox()}
              </div>

              <div className="sectionContainer">
                <div className="containerRow">
                  <div className="nameRow">
                    <h2>{t("QRCodeCat")}</h2>
                    {this.state.isCategoryBoxDisplay ? <button onClick={this.newCategory} className="dd-bordered secondary">{t("addCat")}</button> : null}
                  </div>
                  {categories.filter(c=> c.id === this.state.activeEdit).length ? null : <button className="displayButton" onClick={() => this.handleChange("isCategoryBoxDisplay", !this.state.isCategoryBoxDisplay)}>{(this.state.isCategoryBoxDisplay ? t("hideSection") : t("viewSection"))}</button>}
                </div>
                {this.renderCatBox(categories)}
              </div>

              <div className="sectionContainer">
                <div className="containerRow">
                  <h2 className="titleWithDescription">{t("admins")}</h2>
                  <button className="displayButton" onClick={() => this.handleChange("isAdminBoxDisplay", !this.state.isAdminBoxDisplay)}>{(this.state.isAdminBoxDisplay ? t("hideSection") : t("viewSection"))}</button>
                </div>
                { this.state.isAdminBoxDisplay ? <div>
                  <p className="boxDescription">{t("codeInstructions")}</p>
                  <AttendeeSelector 
                    client={client}
                    searchTitle="Select Admins"
                    selectedTitle="Current Admins"
                    onSelected={this.onAdminSelected}
                    onDeselected={this.onAdminDeselected}
                    selected={this.state.attendees.filter(a => this.isAdmin(a.id))} />
                </div> : null}
              </div>

              <div className="sectionContainer">
                <div className="containerRow">
                  <h2>{t("codes")}</h2>
                  {codes.filter(c=> c.id === this.state.activeEdit).length ? null : <button className="displayButton" onClick={() => this.handleChange("isCodeBoxDisplay", !this.state.isCodeBoxDisplay)}>{(this.state.isCodeBoxDisplay ? t("hideSection") : t("viewSection"))}</button>}
                </div>
                {this.renderCodeBox(codes, categories)}
              </div>

              <div className="attendeeSectionContainer">
                <div className="containerRowSearchBar">
                  <h2>{t("attendees")}</h2>
                  {this.state.isAttendeeBoxDisplay ? <SearchBar updateList={this.updateList} disabled={false} search={this.state.attendeeSearch}/> : null}
                  <div style={{flex: 1}}/>
                  <button className="displayButton" onClick={() => this.hideAttendeeSection()}>{(this.state.isAttendeeBoxDisplay ? t("hideSection") : t("viewSection"))}</button>
                </div>
                {this.state.isAttendeeBoxDisplay ? <div>
                  <ul className="userList">
                    { attendees.sort(this.sortPlayers).map(this.renderUser) }
                    {attendees.length ? null : <h2 className="emptyBoxText">{t("noResults")}</h2>}
                  </ul>
                  <div className="csvLinkBox">
                    <button className="csvButton" onClick={this.formatDataForExportCode}>{t("exportCode")}</button>
                    {this.state.exportingCode ? <CSVDownload data={this.state.exportListCode} target="_blank" /> : null}
                    <button className="csvButton" onClick={this.formatDataForExport}>{t("exportCat")}</button>
                    {this.state.exporting ? <CSVDownload data={this.state.exportList} target="_blank" /> : null}
                  </div>
                </div> : null}
              </div>
            </div>
          : <div>{t("loading")}</div>
        }
      </div>
    )
  }

  formatDataForExportCode = () => {
    let parsedData = []
    this.state.attendees.forEach(attendee => {
      if (this.state.allCodesByUser[attendee.id]) {
        if (this.state.allCodesByUser[attendee.id].scans){
        const scans = Object.keys(this.state.allCodesByUser[attendee.id].scans)
        let parsedUser = {First_Name: attendee.firstName, Last_Name: attendee.lastName, Email: attendee.email, Title: attendee.title, Company: attendee.company}
          scans.forEach(scan => {
            const originalData = this.state.codes.find(code => code.id === scan)
            if (originalData) {
              parsedUser[originalData.name] = "Scanned"
            }
          })
        parsedData.push(parsedUser)
        }
      }
    })
    this.setState({exportingCode: true, exportListCode: parsedData})
    setTimeout(()=>this.setState({exportingCode: false}), 3000)
  }

  formatDataForExport = () => {
    let parsedData = []
    const completed = this.state.attendees.filter(a => this.isDone(a.id))
    this.state.attendees.forEach(attendee => {
      if (this.state.allCodesByUser[attendee.id]) {
        if (this.state.allCodesByUser[attendee.id].scans){
          let gameWinningUser = completed.find(user => user.id === attendee.id)
          const gameWinner = gameWinningUser ? "True" : null
          let parsedUser = {First_Name: attendee.firstName, Last_Name: attendee.lastName, Email: attendee.email, Title: attendee.title, Company: attendee.company, CompletedAllCategories: gameWinner}
          this.state.categories.forEach(cat => {
            const totalCatScans =`Scans for ${cat.name}`
            const completedCat = `Completed ${cat.name}`
            const completedScans = this.categoryScansForUser(cat.id, attendee.id)
            parsedUser[totalCatScans] = completedScans
            parsedUser[completedCat] = completedScans >= cat.scansRequired && completedScans > 0 ? "True" : ""
          })
          parsedData.push(parsedUser)
        }
      }
    })
    this.setState({exporting: true, exportList: parsedData})
    setTimeout(()=>this.setState({exporting: false}), 3000)
  }

  updateList = (value) => {
    this.setState({attendeeSearch: value.length > 0, attendeeSearchValue: value})
  }

  hideAttendeeSection = () => {
    this.handleChange("isAttendeeBoxDisplay", !this.state.isAttendeeBoxDisplay)
    this.setState({attendeeSearch: false, attendeeSearchValue: ""})
  }

  getCustomAttendeeList = () => {
    const queryText = this.state.attendeeSearchValue.toLowerCase()
    if (queryText.length > 0) {
      const queryResult = this.state.attendees.filter(s => { 
        const name = s.firstName.toLowerCase() + " " + s.lastName.toLowerCase()
        return name.includes(queryText)
      })
      return queryResult
    }
    else {
      return this.state.attendees
    }
  }

  onAdminSelected = attendee => {
    const tokenRef = this.props.fbc.database.private.adminableUsersRef(attendee.id).child('adminToken')
    this.setState()
    this.props.fbc.getLongLivedAdminToken().then(token => tokenRef.set(token))
  }

  onAdminDeselected = attendee => {
    const tokenRef = this.props.fbc.database.private.adminableUsersRef(attendee.id).child('adminToken')
    tokenRef.remove()
  }

  setCatName = (id, value) => {
    this.categoriesRef().child(id).child('name').set(value)
  }

  setCatDes= (id, value) => {
    this.categoriesRef().child(id).child('description').set(value)
  }

  setCatNumb = (id, value) => {
    this.categoriesRef().child(id).child('scansRequired').set(+value || 0)
  }

  setCodeName = (id, value) => {
    this.codesRef().child(id).child('name').set(value)
  }

  setCodeNumb = (id, value) => {
    this.codesRef().child(id).child('categoryId').set(value)
  }

  renderUser = user => {
    const { id, firstName, lastName } = user
    return (
      <li key={id} className={this.isDone(user.id) ? 'is-done' : 'not-done'}>
        <div><Avatar user={user} size={30}/></div>
        <span className="name"> {firstName} {lastName}</span>
        { this.state.categories.map(cat => <span className="catScans" key={cat.id}>
            {cat.name}: {this.categoryScansForUser(cat.id, user.id)}
          </span>)
        }
        <div className="flex"/>
        <button className="dd-bordered" onClick={()=>this.deleteUserScans(user)}>{t("deleteScans")}</button>
      </li>
    )
  }

  deleteUserScans = (user) => {
    if(window.confirm(t("confirmDelete"))){
      this.props.fbc.database.private.adminableUsersRef(user.id).child("scans").remove()
    }
  }

  categoryScansForUser = (categoryId, userId) => (this.state.scansPerUserPerCategory[userId] || {})[categoryId] || 0
  isDone = userId => !!this.state.categories.length && !this.state.categories.find(cat => this.categoryScansForUser(cat.id, userId) < (cat.scansRequired || 0))

  newCategory = () => {
    const activeCat = this.state.categories.find(cat => cat.id === this.state.activeEdit)

    if (!activeCat) {
      this.categoriesRef().push({name: 'New QR Code Category'})
    }
  }

  removeCategory = category => () => {
    if (window.confirm(t("confirmDeleteCat", {name: category.name}))) {
      this.categoriesRef().child(category.id).remove()
    }
  }

  removeCode = code => () => {
    if (window.confirm(t("confirmDeleteCode", {name: code.name}))) {
      this.codesRef().child(code.id).remove()
    }
    this.state.attendees.forEach(attendee => {
      if (this.state.allCodesByUser[attendee.id]){
        let scans = this.state.allCodesByUser[attendee.id].scans
        if (scans){
          if (scans[code.id]){
            this.props.fbc.database.private.adminableUsersRef(attendee.id).child("scans").child(code.id).remove()
          }
        }
      }
    })
  }

  isAdmin(id) {
    return this.state.admins.includes(id)
  }

  setAdmin(userId, isAdmin) {
    const tokenRef = this.props.fbc.database.private.adminableUsersRef(userId).child('adminToken')
    if (isAdmin) {
      this.setState()
      this.props.fbc.getLongLivedAdminToken().then(token => tokenRef.set(token))
    } else {
      tokenRef.remove()
    }
  }

  setCurrentEdit = (id) => {
    this.setState({activeEdit: id})
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

export default provideFirebaseConnectorToReactComponent(client, 'qrhunt', (props, fbc) => <App {...props} fbc={fbc} />, PureComponent)

function sortByName(a, b) {
  return (a.name || '').toLowerCase() < (b.name || '').toLowerCase() ? -1 : 1
}
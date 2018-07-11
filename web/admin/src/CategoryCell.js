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

export default class CategoryCell extends Component {
  constructor() {
    super()
    this.state = {
      isEditing : false,
      originalName: "",
      originalValue: 0
  }
}

componentWillReceiveProps(newProps) {
  if (newProps.activeEdit !== this.props.category.id){
    this.resetInfo()
  }
}

  toggleEdit = () => {
    this.setState({isEditing: !this.state.isEditing, originalName: this.props.category.name, originalValue: this.props.category.scansRequired})
    this.props.setCurrentEdit(this.props.category.id)
  }

  endEdit = () => {
    this.setState({isEditing: !this.state.isEditing, originalName: this.props.category.name, originalValue: this.props.category.scansRequired})
    this.props.setCurrentEdit("")
  }

  resetInfo = () => {
    this.props.setCatName(this.props.category.id, this.state.originalName)
    this.props.setCatNumb(this.props.category.id, this.state.originalValue)
    this.setState({isEditing: false})
  }

  cancelEdits = () => {
    this.props.setCatName(this.props.category.id, this.state.originalName)
    this.props.setCatNumb(this.props.category.id, this.state.originalValue)
    this.setState({isEditing: false})
    this.props.setCurrentEdit("")
  }

  render() {
    const { id, name, scansRequired } = this.props.category
    if (!this.state.isEditing) {
      return (
        <li key={id}>
          <p className="cellName">{name}</p>&nbsp;
          <p>{scansRequired || 0} {scansRequired === 1 ? "scan" : "scans"} required</p>
          <div style={{flex:1}}/>
          <button className="noBorderButton" onClick={this.toggleEdit}>Edit</button>&nbsp;
          <button className="noBorderButton" onClick={this.props.removeCategory(this.props.category)}>Remove</button>&nbsp;
        </li>
      )
    }
    else {
      return (
        <li key={id}>
          <input className="catNameText" type="text" value={name} placeholder="Category Name" onChange={e => this.props.setCatName(id, e.target.value)} />&nbsp;
          <input className="catNumbText" type="number" value={scansRequired || 0} onChange={e => this.props.setCatNumb(id, e.target.value)} min={0} max={100} />&nbsp;{scansRequired === 1 ? "scan" : "scans"} required
          <div style={{flex:1}}/>
          <button className="noBorderButton" onClick={this.endEdit}>Save</button>&nbsp;
          <button className="noBorderButton" onClick={this.cancelEdits}>Cancel</button>&nbsp;
        </li>
      )
    }
  }
}
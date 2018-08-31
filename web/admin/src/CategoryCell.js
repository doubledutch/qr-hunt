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
import ReactTooltip from "react-tooltip"
import AlertIcon from "./alerticon.png"

export default class CategoryCell extends Component {
  constructor() {
    super()
    this.state = {
      isEditing : false,
      catName: "",
      catValue: 0,
      isError: false
    }
  }

  componentDidMount() {
    this.setState({catName: this.props.category.name, catValue: this.props.category.scansRequired})
  }

  toggleEdit = () => {
    this.setState({isEditing: !this.state.isEditing, catName: this.props.category.name, catValue: this.props.category.scansRequired})
    this.props.setCurrentEdit(this.props.category.id)
  }

  saveEdit = () => {
    const isDup = this.props.categories.find(cat => cat.name.toLowerCase() === this.state.catName.trim().toLowerCase() && cat.id !== this.props.category.id)
    if (isDup) { this.setState({isError: true}) }
    else {
      this.props.setCatName(this.props.category.id, this.state.catName.trim())
      this.props.setCatNumb(this.props.category.id, this.state.catValue)
      this.props.setCurrentEdit("")
    }
  }

  cancelEdits = () => {
    this.setState({isEditing: false, catName: this.props.category.name, catValue: this.props.category.scansRequired, isError: false})
    this.props.setCurrentEdit("")
  }

  render() {
    const { id, name, scansRequired } = this.props.category
    if (this.props.category.id !== this.props.activeEdit) {
      return (
        <li key={id}>
          <p className="cellName">{name}</p>&nbsp;
          <p>{scansRequired || 0} {scansRequired === 1 ? "scan" : "scans"} required</p>
          {this.renderNeedsMoreCatCodes()}
          <div style={{flex:1}}/>
          <button className="noBorderButton" onClick={this.toggleEdit}>Edit</button>&nbsp;
          <button className="noBorderButton" onClick={this.props.removeCategory(this.props.category)}>Remove</button>&nbsp;
          <ReactTooltip multiline={true}/>
        </li>
      )
    }
    else {
      return (
        <li key={id}>
          <input className="catNameText" type="text" value={this.state.catName} placeholder="Category Name" onChange={(e) => this.setState({catName: e.target.value, isError: false})} />&nbsp;
          <input className="catNumbText" type="number" value={this.state.catValue || 0} onChange={(e) => this.setState({catValue: +e.target.value})} min={0} max={100} />&nbsp;{scansRequired === 1 ? "scan" : "scans"} required
          {this.renderNeedsMoreCatCodes()}
          <div style={{flex:1}}/>
          { this.renderSaveButton() }
          <button className="noBorderButton" onClick={this.cancelEdits}>Cancel</button>&nbsp;
          <ReactTooltip multiline={true}/>
        </li>
      )
    }
  }

  renderNeedsMoreCatCodes = () => {
    const total = this.props.codes.filter(code => code.categoryId === this.props.category.id)
    if (this.props.category.scansRequired && total.length < this.props.category.scansRequired) {
      return <img data-tip="More QR codes are required than are available. <br /> The category will remain hidden for attendees <br /> until there are enough codes to complete the category." className="box-icon" src={AlertIcon} alt="alert"/>
    }
    else {
      return null
    }
  }

  renderSaveButton = () => {
    if (this.state.isError) {
      return (
        <button className="noBorderButtonRed" onClick={this.saveEdit}>Rename</button>
      )
    }
    else if (this.state.catName.trim().length){
      return (
        <button className="noBorderButton" onClick={this.saveEdit}>Save</button>
      ) 
    }
    else {
      return null
    }
  }

}
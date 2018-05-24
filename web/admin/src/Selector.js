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
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faSearch from '@fortawesome/fontawesome-free-solid/faSearch'
import {TextInput} from '@doubledutch/react-components'

export default class Selector extends PureComponent {
  render() {
    const {className, onSelected, onDeselected, searchTitle, selectedTitle} = this.props

    return (
      <div className={`selector-row ${className}`}>
        <SearchInput />
      </div>
    )
  }
}

const SearchInput = props => <TextInput icon={({className}) => <FontAwesomeIcon icon={faSearch} className={className} />} placeholder="Search" {...props} />
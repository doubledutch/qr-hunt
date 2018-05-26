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

import React, {PureComponent} from 'react'
import Selector from './Selector'

// Attendee-specific Selector
export default class AttendeeSelector extends PureComponent {
  render() {
    return <Selector selectedTextFn={nameOf}
                     search={this.search}
                     {...this.props} />
  }

  search = query => query ? this.props.client.getAttendees(query) : Promise.resolve([])
}

const nameOf = attendee => `${attendee.firstName} ${attendee.lastName}`

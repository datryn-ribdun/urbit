import {
  Col,
  ManagedToggleSwitchField as Toggle, Text
} from '@tlon/indigo-react';
import { Form, FormikHelpers } from 'formik';
import _ from 'lodash';
import React, { useCallback } from 'react';
import { isWatching } from '~/logic/lib/hark';
import useHarkState from '~/logic/state/hark';
import { FormikOnBlur } from '~/views/components/FormikOnBlur';
import { BackButton } from './BackButton';
import { GroupChannelPicker } from './GroupChannelPicker';
import {
  setMentions,
  setWatchOnSelf,
  setDoNotDisturb,
  listenGraph,
  listenGroup,
  ignoreGraph,
  ignoreGroup
} from '@urbit/api';
import useSettingsState from '~/logic/state/settings';

interface FormSchema {
  mentions: boolean;
  dnd: boolean;
  watchOnSelf: boolean;
  pushNotificationDetails: boolean;
  graph: {
    [rid: string]: boolean;
  };
  groups: {
    [rid: string]: boolean;
  }
}

export function NotificationPreferences() {
  const dnd = useHarkState(state => state.doNotDisturb);
  const graphConfig = useHarkState(state => state.notificationsGraphConfig);
  const groupConfig = useHarkState(s => s.notificationsGroupConfig);
  const { putEntry, pushNotifications: { pushNotificationDetails } } = useSettingsState.getState();
  const initialValues = {
    mentions: graphConfig.mentions,
    watchOnSelf: graphConfig.watchOnSelf,
    pushNotificationDetails,
    dnd
  };

  const onSubmit = useCallback(async (values: FormSchema, actions: FormikHelpers<FormSchema>) => {
    try {
      const { poke } = useHarkState.getState();
      if (values.pushNotificationDetails !== pushNotificationDetails) {
        putEntry('pushNotifications', 'pushNotificationDetails', values.pushNotificationDetails);
      }
      if (values.mentions !== graphConfig.mentions) {
        poke(setMentions(values.mentions));
      }
      if (values.watchOnSelf !== graphConfig.watchOnSelf) {
        poke(setWatchOnSelf(values.watchOnSelf));
      }
      if (values.dnd !== dnd && !_.isUndefined(values.dnd)) {
        poke(setDoNotDisturb(values.dnd));
      }
      _.forEach(values.graph, (listen: boolean, graph: string) => {
        if(listen !== isWatching(graphConfig, graph)) {
          poke((listen ? listenGraph : ignoreGraph)(graph, '/'));
        }
      });
      _.forEach(values.groups, (listen: boolean, group: string) => {
        if(listen !== groupConfig.includes(group)) {
          poke((listen ? listenGroup : ignoreGroup)(group));
        }
      });
      actions.setStatus({ success: null });
    } catch (e) {
      console.error(e);
      actions.setStatus({ error: e.message });
    }
  }, [graphConfig, dnd]);

  return (
    <>
    <BackButton />
    <Col p={5} pt={4} gapY={5}>
      <Col gapY={1} mt={0}>
        <Text fontSize={2} fontWeight="medium">
          Notification Preferences
        </Text>
        <Text gray>
          Set notification visibility and default behaviours for groups and
          messaging
        </Text>
      </Col>
      <FormikOnBlur initialValues={initialValues} onSubmit={onSubmit}>
        <Form>
          <Col gapY="4">
            <Toggle
              label="Do not disturb"
              id="dnd"
              caption="You won't see the notification badge, but notifications will still appear in your inbox."
            />
            <Toggle
              label="Watch for replies"
              id="watchOnSelf"
              caption="Automatically follow a post for notifications when it's yours"
            />
            <Toggle
              label="Watch for mentions"
              id="mentions"
              caption="Notify me if someone mentions my @p in a channel I've joined"
            />
            <Toggle
              label="Show details in push notifications"
              id="pushNotificationDetails"
              caption="Include message text and mention info in push notifications"
            />
            <Col gapY={3}>
              <Text lineHeight="tall">
                Activity
              </Text>
              <Text gray>
                Set which groups will send you notifications.
              </Text>
              <GroupChannelPicker />
            </Col>
          </Col>
        </Form>
      </FormikOnBlur>
    </Col>
    </>
  );
}

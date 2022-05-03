::
/-  *notify, hark-store, settings, met=metadata-store
/+  default-agent, verb, dbug, agentio, res=resource
::
|%
+$  card  card:agent:gall
::
+$  provider-state  (map term provider-entry)
+$  provider-entry
  $:  notify-endpoint=@t
      binding-endpoint=@t
      auth-token=@t
      clients=(map ship binding=(unit @t))
      =whitelist
  ==
::
+$  client-state
  $:  providers=(jug @p term)
  ==
::
+$  base-state-0
  $:  =provider-state
      =client-state
  ==
+$  base-state-2
  $:  notifications=(map uid notification)
      base-state-0
  ==
::
+$  state-0
  [%0 base-state-0]
::
+$  state-1
  [%1 base-state-0]
::
+$  state-2
  [%2 base-state-2]
::
+$  versioned-state
  $%  state-0
      state-1
      state-2
  ==
::
--
::
=|  state-2
=*  state  -
::
%-  agent:dbug
%+  verb  |
^-  agent:gall
::
=<
  |_  =bowl:gall
  +*  this  .
      def   ~(. (default-agent this %|) bowl)
      do    ~(. +> bowl)
      io    ~(. agentio bowl)
      pass  pass:io
  ::
  ++  on-init
    :_  this
    :~  (~(watch-our pass:io /hark/notes) %hark-store /notes)
        (~(watch-our pass:io /hark/updates) %hark-store /updates)
    ==
  ::
  ++  on-save   !>(state)
  ++  on-load
    |=  =old=vase
    ^-  (quip card _this)
    =/  old  !<(versioned-state old-vase)
    =|  cards=(list card)
    |-
    ?-  -.old
    ::
        %2
      =/  upd=wire  /hark/updates
      =/  not=wire  /hark/notes
      =/  =dock  [our.bowl %hark-store]
      =?  cards  !(~(has by wex.bowl) [upd dock])  :: rewatch updates
        :_(cards [%pass upd %agent dock %watch /updates])
      =?  cards  !(~(has by wex.bowl) [not dock])  ::  rewatch notes
        :_(cards [%pass not %agent dock %watch /notes])
      =.  notifications.old  ~
      [(flop cards) this(state old)]
    ::
        ?(%0 %1)
      %_  $
        -.old  %2
        +.old  [~ +.old]
      ==
    ==
  ::
  ++  on-poke
    |=  [=mark =vase]
    ^-  (quip card _this)
    (on-poke:def mark vase)
  ::
  ++  on-watch
    |=  =path
    ^-  (quip card _this)
    ?+  path  (on-watch:def path)
        [%notify @ @ ~]
      =*  service  i.t.t.path
      ?.  (~(has ju providers.client-state) src.bowl service)
        ~|("permission denied" !!)
      `this
    ==
  ::
  ++  on-leave
    |=  =path
    ^-  (quip card _this)
    `this
  ::
  ++  on-peek
    |=  =path
    ^-  (unit (unit cage))
    =/  =(pole knot)  path
    ?+  pole  [~ ~]
    ::
        [%x %note uid=@t ~]
      =/  =uid  (slav %ux uid.pole)
      =/  note=notification  (~(got by notifications) uid)
      ``hark-note+!>(note)
    ==
  ::
  ++  on-agent
    |=  [=wire =sign:agent:gall]
    ^-  (quip card _this)
    ?+  wire  (on-agent:def wire sign)
    ::
    ::  subscription from client to their own hark-store
    ::
        [%hark @ ~]
      ?+  -.sign  (on-agent:def wire sign)
          %fact
        ?.  ?=(%hark-update p.cage.sign)
          `this
        =+  !<(hark-update=update:hark-store q.cage.sign)
        =^  cards  state
          (filter-notifications:do hark-update)
        [cards this]
      ::
          %kick
        :_  this
        [%pass wire %agent [our.bowl %hark-store] %watch t.wire]~
      ==
    ==
  ::
  ++  on-arvo
  |=  [=wire =sign-arvo]
  ^-  (quip card _this)
  ?+  wire  (on-arvo:def wire sign-arvo)
      [%push-notification *]
    `this
  ==
  ::
  ++  on-fail   on-fail:def
  --
|_  bowl=bowl:gall
::
++  filter-notifications
  |=  upd=update:hark-store
  ^-  (quip card _state)
  ?+    -.upd  `state
  ::
      %add-note
    ::  read from settings-store
    ::
    ?.  .^(? %gx /(scot %p our.bowl)/settings-store/(scot %da now.bowl)/has-bucket/landscape/escape-app/noun)
      `state
    ?.  .^(? %gx /(scot %p our.bowl)/settings-store/(scot %da now.bowl)/has-entry/landscape/escape-app/expo-token/noun)
      `state
    =/  =data:settings
      .^(data:settings %gx /(scot %p our.bowl)/settings-store/(scot %da now.bowl)/entry/landscape/escape-app/expo-token/noun)
    ?.  ?=(%entry -.data)
      `state
    ?.  ?=(%s -.val.data)
      `state
    ::
    =/  include-details=?
      ?.  .^(? %gx /(scot %p our.bowl)/settings-store/(scot %da now.bowl)/has-bucket/landscape/(scot %tas 'pushNotifications')/noun)
        %.n
      ?.  .^(? %gx /(scot %p our.bowl)/settings-store/(scot %da now.bowl)/has-entry/landscape/(scot %tas 'pushNotifications')/(scot %tas 'pushNotificationDetails')/noun)
        %.n
      =/  include-data=data:settings
        .^(data:settings %gx /(scot %p our.bowl)/settings-store/(scot %da now.bowl)/entry/landscape/(scot %tas 'pushNotifications')/(scot %tas 'pushNotificationDetails')/noun)
      ?.  ?=(%entry -.include-data)
        %.n
      ?.  ?=(%b -.val.include-data)
        %.n
      p.val.include-data
    ::  send http request
    ::
    =/  =header-list:http
      :~  ['Content-Type' 'application/json']
      ==
    =/  note=notification  +.upd
    =/  title=@t  (contents-to-cord title.body.note)
    =/  json-list=(list [@t json])
      :~  to+s+p.val.data
          title+s+title
          :-  %data
          %-  pairs:enjs:format
          :~  redirect+s+(get-notification-redirect link.body.note)
              ship+s+(scot %p our.bowl)
      ==  ==
    =.  json-list
      ?:  include-details
        =/  body=@t  (contents-to-cord content.body.note)
        [body+s+body json-list]
      json-list
    =|  =request:http
    =:  method.request       %'POST'
        url.request          'https://exp.host/--/api/v2/push/send'
        header-list.request  header-list
        body.request
      :-  ~
      %-  as-octt:mimes:html
      %-  en-json:html
      %-  pairs:enjs:format
      json-list
    ==
    [~[[%pass /push-notification/(scot %da now.bowl) %arvo %i %request request *outbound-config:iris]] state]
  ==
::
++  contents-to-cord
  |=  contents=(list content:hark-store)
  %+  rap  3
  %+  turn  contents
  |=  [type=?(%ship %text) content=@]
  ^-  @t
  ?:  ?=(%ship type)
    (scot %p content)
  ?.  =('New messages from ' content)
    content
  'New DM from '
::
++  get-notification-redirect
  |=  link=path
  ^-  @t
  |^
  ?+    (slav %tas -.link)  (get-graph-redirect link)
      %invite
    (get-invite-redirect link)
    ::
      %dm
    (get-dm-redirect link)
    ::
      %groups
    (get-group-redirect link)
  ==
  ::
  ++  get-graph-redirect
    |=  link=path
    ^-  @t
    |^
    =/  rid=resource:res
      (cords-to-resource (snag 1 link) (snag 2 link))
    =/  index=path  (slag 3 link)
    ?+    (slav %tas -.link)  !!  ::  TODO: is crashing appropriate?
        %graph-validator-dm
      =/  sender=@p  `@p`(rash `@t`(snag 3 link) dim:ag)
      (rap 3 '/~landscape/messages/dm/' (scot %p sender) ~)
      ::
        %graph-validator-chat
      (get-chat-redirect rid index)
      ::
        %graph-validator-publish
      (get-publish-redirect rid index)
      ::
        %graph-validator-link
      (get-link-redirect rid index)
      ::
        %graph-validator-post
      (get-post-redirect rid index)
    ==
    ::
    ++  get-chat-redirect
      |=  [rid=resource:res index=path]
      ^-  @t
      =/  base=@t  (get-group-resource-redirect rid)
      ?:  (gte 0 (lent index))
        base
      (rap 3 base '?msg=' (snag 0 index) ~)
    ::
    ++  get-publish-redirect
      |=  [rid=resource:res index=path]
      ^-  @t
      =/  base=@t  (get-group-resource-redirect rid)
      =/  l=@ud  (lent index)
      ?:  =(3 l)
        (rap 3 base '/note/' (snag 0 index) ~)
      ?:  =(4 l)
        (rap 3 base '/note/' (snag 0 index) '?selected=' (snag 2 index) ~)
      base
    ::
    ++  get-link-redirect
      |=  [rid=resource:res index=path]
      ^-  @t
      =/  base=@t  (get-group-resource-redirect rid)
      =/  l=@ud  (lent index)
      ?:  =(1 l)
        (rap 3 base '/index/' (snag 0 index) ~)
      ?:  =(3 l)
        (rap 3 base '/index/' (snag 0 index) '?selected=' (snag 1 index) ~)
      base
    ::
    ++  get-post-redirect
      |=  [rid=resource:res index=path]
      ^-  @t
      =/  as=(unit association:met)  (scry-graph-metadata rid)
      ?~  as  ''
      =/  group-rid=@t
        (rap 3 'ship/' (resource-to-cord group.u.as) ~)
      (rap 3 '/~landscape/' group-rid '/feed/thread/' (join '/' index))
    ::
    ++  get-group-resource-redirect
      |=  graph-rid=resource:res
      ^-  @t
      =/  as=(unit association:met)  (scry-graph-metadata graph-rid)
      ?~  as  ''
      =/  graph-rid-tape=@t
        (rap 3 'ship/' (resource-to-cord graph-rid) ~)
      =/  group-rid-tape=@t  (resource-to-cord group.u.as)
      =/  section=@t
        ?:  =(graph-rid group.u.as)
          'messages'
        (rap 3 'ship/' group-rid-tape ~)
      ?.  ?=(%graph -.config.metadatum.u.as)  ''
      (rap 3 '/~landscape/' section '/resource/' (scot %tas module.config.metadatum.u.as) '/' graph-rid-tape ~)
    --
  ::
  ++  get-invite-redirect
    |=  link=path
    ^-  @t
    '/'
  ::
  ++  get-dm-redirect
    |=  link=path
    ^-  @t
    =/  ship-name=@t  (snag 1 link)
    (rap 3 '/~landscape/messages/dm/' ship-name ~)
  ::
  ++  get-group-redirect
    |=  link=path
    ^-  @t
    =/  ship-name=@t  (snag 1 link)
    =/  group-name=@t  (snag 2 link)
    (rap 3 '/~landscape/ship/' ship-name '/' group-name ~)
  ::
  ++  cords-to-resource
    |=  [ship-cord=@t name-cord=@t]
    ^-  resource:res
    :-  (slav %p ship-cord)
    (slav %tas name-cord)
  ::
  ++  resource-to-cords
    |=  =resource:res
    ^-  (pair @t @t)
    :-  (scot %p entity.resource)
    (scot %tas name.resource)
  ::
  ++  resource-to-cord
    |=  =resource:res
    ^-  @t
    =/  cords=(pair @t @t)  (resource-to-cords resource)
    (rap 3 p.cords '/' q.cords ~)
  --
::
++  scry-graph-metadata
  |=  rid=resource:res
  ^-  (unit association:met)
  =/  =associations:met
    .^(associations:met %gx /(scot %p our.bowl)/metadata-store/(scot %da now.bowl)/app-name/graph/noun)
  (~(get by associations) [%graph rid])
--

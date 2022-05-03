import VisibilitySensor from 'react-visibility-sensor';
import React, { FC, PropsWithChildren, ReactNode, useCallback, useState, useImperativeHandle, MouseEvent, useMemo, useRef, useEffect } from 'react';
import Picker from 'emoji-picker-react';
import { Box, Col, Icon, LoadingSpinner, Row, Text } from '@tlon/indigo-react';
import { Association, Contact, Content, evalCord, Group } from '@urbit/api';
import tokenizeMessage from '~/logic/lib/tokenizeMessage';
import { IuseStorage } from '~/logic/lib/useStorage';
import { MOBILE_BROWSER_REGEX } from '~/logic/lib/util';
import { withLocalState } from '~/logic/state/local';
import airlock from '~/logic/api';
import { useChatStore, useReplyStore } from '~/logic/state/chat';
import { FileUploadSource, useFileUpload } from '~/logic/lib/useFileUpload';
import { Portal } from '~/views/components/Portal';
import styled from 'styled-components';
import { useOutsideClick } from '~/logic/lib/useOutsideClick';
import { IS_MOBILE } from '~/logic/lib/platform';
import { useDark } from '~/logic/state/join';
import ChatEditor, { CodeMirrorShim, isMobile } from './ChatEditor';
import { ChatAvatar } from './ChatAvatar';
import './ChatInput.scss';
import { parseEmojis } from '~/views/landscape/components/Graph/parse';

const FixedOverlay = styled(Col)`
  position: fixed;
  -webkit-transition: all 0.1s ease-out;
  -moz-transition: all 0.1s ease-out;
  -o-transition: all 0.1s ease-out;
  transition: all 0.1s ease-out;
`;

type ChatInputProps = PropsWithChildren<
  IuseStorage & {
    hideAvatars: boolean;
    ourContact?: Contact;
    placeholder: string;
    onSubmit: (contents: Content[]) => void;
    uploadError: string;
    setUploadError: (val: string) => void;
    handleUploadError: (err: Error) => void;
    isAdmin: boolean;
    group: Group;
    association: Association;
    chatEditor: React.RefObject<CodeMirrorShim>
  }
>;

const InputBox: FC<{ isReply: boolean; children?: ReactNode; }> = ({ isReply, children }) => (
  <Col
    position='relative'
    flexGrow={1}
    flexShrink={0}
    borderTop={1}
    borderTopColor="lightGray"
    backgroundColor="white"
    className="cf"
    zIndex={0}
    height={isReply ? `${IS_MOBILE ? 100 : 84}px` : 'auto'}
  >
    { children }
  </Col>
);

const IconBox = ({ children, ...props }) => (
  <Box
    ml="12px"
    mr={3}
    flexShrink={0}
    height="16px"
    width="16px"
    flexBasis="16px"
    {...props}
  >
    {children}
  </Box>
);

const MobileSubmitButton = ({ enabled, onSubmit }) => (
  <Box
    ml={2}
    mr="12px"
    flexShrink={0}
    display="flex"
    justifyContent="center"
    alignItems="center"
    width="24px"
    height="24px"
    borderRadius="50%"
    backgroundColor={enabled ? 'blue' : 'gray'}
    cursor={enabled !== '' ? 'pointer' : 'default'}
    onClick={() => onSubmit()}
  >
    <Icon icon="ArrowEast" color="white" />
  </Box>
);

export const ChatInput = React.forwardRef(({
  ourContact,
  hideAvatars,
  placeholder,
  onSubmit,
  isAdmin,
  group,
  association,
  uploadError,
  setUploadError,
  handleUploadError,
  chatEditor
}: ChatInputProps, ref) => {
  // const chatEditor = useRef<CodeMirrorShim>(null);

  useImperativeHandle(ref, () => chatEditor.current);
  const [showPortal, setShowPortal] = useState(false);
  const [visible, setVisible] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => chatEditor.current);
  const [inCodeMode, setInCodeMode] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const dark = useDark();
  const { message, setMessage } = useChatStore();
  const { reply, setReply } = useReplyStore();
  const { canUpload, uploading, promptUpload, onPaste } = useFileUpload({
    onSuccess: uploadSuccess,
    onError: handleUploadError
  });

  useOutsideClick(innerRef, () => setShowPortal(false));

  function uploadSuccess(url: string, source: FileUploadSource) {
    if (source === 'paste') {
      setMessage(url);
    } else {
      onSubmit([{ url }]);
    }
    setUploadError('');
  }

  function toggleCode() {
    setInCodeMode(!inCodeMode);
  }

  useEffect(() => {
    if (!visible) {
      setShowPortal(false);
    }
  }, [visible]);

  const submit = useCallback(async () => {
    const text = reply.link && chatEditor.current?.getValue().slice(0,3) === '```'
      ? `${reply.link}\n${chatEditor.current?.getValue()}`
      : `${reply.link}${chatEditor.current?.getValue() || ''}`;

    if (text === '')
      return;

    if (inCodeMode) {
      const output = await airlock.thread<string[]>(evalCord(text));
      onSubmit([{ code: { output, expression: text } }]);
    } else {
      onSubmit(tokenizeMessage(parseEmojis(text)));
    }

    setInCodeMode(false);
    setMessage('');
    setReply();
    chatEditor.current.focus();
  }, [reply, inCodeMode]);

  const onEmojiClick = (event, emojiObject) => {
    if (isMobile) {
      const cursor = chatEditor?.current?.getCursor();
      const value = chatEditor?.current?.getValue();
      const newValue = `${value.slice(0, cursor)}${emojiObject.emoji}${value.slice(cursor)}`;
      chatEditor?.current?.setValue(newValue);
      setMessage(newValue);
    } else {
      const doc = chatEditor?.current?.getDoc();
      const cursor = doc.getCursor();
      doc.replaceRange(emojiObject.emoji, cursor);
    }

    setShowEmojiPicker(false);
    chatEditor?.current?.focus();
  };

  const closeEmojiPicker = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowEmojiPicker(false);
  };

  const isReply = Boolean(reply.link);
  const [, patp] = reply.link.split('\n');

  const emojiPickerStyle = useMemo(() => ({
    background: dark ? 'rgb(26,26,26)' : 'white',
    color: dark ? 'white' : 'rgb(26,26,26)',
    boxShadow: '0 0 3px #efefef',
    borderColor: dark ? 'black' : 'white'
  }), [dark]);

  return (
    <Box ref={outerRef}>
      <VisibilitySensor active={showPortal} onChange={setVisible}>
        <InputBox isReply={isReply}>
          {showPortal && (
            <Portal>
              <FixedOverlay
                ref={innerRef}
                backgroundColor="white"
                color="washedGray"
                border={1}
                right={25}
                bottom={75}
                borderRadius={2}
                borderColor="lightGray"
                boxShadow="0px 0px 0px 3px"
                zIndex={3}
                fontSize={0}
                width="250px"
                padding={3}
                justifyContent="center"
                alignItems="center"
              >
                <Text>{uploadError}</Text>
                <Text>Please check S3 settings.</Text>
              </FixedOverlay>
            </Portal>
          )}
          {(isReply) && (
            <Row mt={2} ml="12px" p={1} px="6px" mr="auto" borderRadius={3} backgroundColor="washedGray" cursor='pointer' maxWidth="calc(100% - 24px)" onClick={() => setReply('')}>
              <Icon icon="X" size={18} mr={1} />
              <Text whiteSpace='nowrap' textOverflow='ellipsis' maxWidth="100%" overflow="hidden">Replying to <Text mono>{patp}</Text> {`"${reply.content}"`}</Text>
            </Row>
          )}
          {showEmojiPicker && (
            <Box position="absolute" bottom="42px" backgroundColor="white" borderRadius={4}>
              <Box position="fixed" top="0" bottom="0" left="0" right="0" background="transparent" onClick={closeEmojiPicker} />
              <Picker onEmojiClick={onEmojiClick} pickerStyle={emojiPickerStyle} />
            </Box>
          )}
          <Row alignItems='center' position='relative' flexGrow={1} flexShrink={0}>
            {isMobile ? (
              <Row p="12px 4px 12px 12px" flexShrink={0} alignItems="center">
                <ChatAvatar contact={ourContact} hideAvatars={hideAvatars} />
              </Row>
            ) : (
              <Row cursor='pointer' p='8px 4px 12px 8px' flexShrink={0} alignItems='center' onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                <Text fontSize="28px" lineHeight="0.75">&#9786;</Text>
              </Row>
            )}
            <ChatEditor
              ref={chatEditor}
              inCodeMode={inCodeMode}
              onPaste={(cm, e) => onPaste(e)}
              {...{ submit, placeholder, isAdmin, group, association, setShowEmojiPicker }}
            />
            <IconBox mr={canUpload ? '12px' : 3}>
              <Icon
                icon="Dojo"
                cursor="pointer"
                onClick={toggleCode}
                color={inCodeMode ? 'blue' : 'black'}
              />
            </IconBox>
            {canUpload && (
              <IconBox>
                {uploadError == '' && uploading && <LoadingSpinner />}
                {uploadError !== '' && (
                  <Icon
                    icon="ExclaimationMark"
                    cursor="pointer"
                    onClick={() => setShowPortal(true)}
                  />
                )}
                {uploadError == '' && !uploading && (
                  <Icon
                    icon="Attachment"
                    cursor="pointer"
                    width="16"
                    height="16"
                    onClick={() =>
                      promptUpload().then(url =>
                        uploadSuccess(url, 'direct')
                      )
                    }
                  />
                )}
              </IconBox>
            )}
            {MOBILE_BROWSER_REGEX.test(navigator.userAgent) && (
              <MobileSubmitButton enabled={message !== ''} onSubmit={submit} />
            )}
          </Row>
        </InputBox>
      </VisibilitySensor>
    </Box>
  );
});

// @ts-ignore withLocalState prop passing weirdness
export default withLocalState<
  Omit<ChatInputProps, keyof IuseStorage>,
  'hideAvatars',
  typeof ChatInput
>(ChatInput, ['hideAvatars']);

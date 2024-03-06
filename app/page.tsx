import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  NextServerPageProps,
  getFrameMessage,
  getPreviousFrame,
  useFramesReducer,
} from "frames.js/next/server";
import Link from "next/link";
import { DEFAULT_DEBUGGER_HUB_URL, createDebugUrl } from "./debug";
import { currentURL } from "./utils";

type State = {
  active: string;
  total_button_presses: number;
};

const initialState = { active: "1", total_button_presses: 0 };

const reducer: FrameReducer<State> = (state, action) => {
  return {
    total_button_presses: state.total_button_presses + 1,
    active: action.postBody?.untrustedData.buttonIndex
      ? String(action.postBody?.untrustedData.buttonIndex)
      : "1",
  };
};

async function handleFollowRequest(fid: string) {
  try {
    const response = await fetch("https://api.neynar.com/v2/farcaster/user/follow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        api_key: "96DF8866-B2A8-4C2F-8D93-9487246B1BB7", // Replace this with your actual API key
      },
      body: JSON.stringify({
        signer_uuid: "130f560f-c9c7-41ab-ba06-da8d1223f5ce", // Replace this with your actual signer UUID
        target_fids: [fid], // Assuming fid is a string
      }),
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error("Error:", error);
  }
}

// This is a react server component only
export default async function Home({ searchParams }: NextServerPageProps) {
  const url = currentURL("/");
  const previousFrame = getPreviousFrame<State>(searchParams);

  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    hubHttpUrl: DEFAULT_DEBUGGER_HUB_URL,
  });

  if (frameMessage && !frameMessage?.isValid) {
    throw new Error("Invalid frame payload");
  }

  const [state, dispatch] = useFramesReducer<State>(
    reducer,
    initialState,
    previousFrame
  );

  // Here: do a server side side effect either sync or async (using await), such as minting an NFT if you want.
  // example: load the users credentials & check they have an NFT
  // Handling follow request based on user's action
  if (previousFrame.postBody?.untrustedData.buttonIndex) {
    await handleFollowRequest(String(frameMessage.requesterFid));
  }

  console.log("info: state is:", state);

  // then, when done, return next frame
  return (
    <div className="p-4">
      frames.js starter kit. The Template Frame is on this page, in
      the html meta tags (inspect source). <Link href={createDebugUrl(url)} className="underline">
        Debug
      </Link>
      <FrameContainer
        postUrl="/frames"
        pathname="/"
        state={state}
        previousFrame={previousFrame}
      >
        <FrameImage aspectRatio="1.91:1">
          <div style={{ width: '100%', height: '10%', backgroundColor: 'black', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              {frameMessage?.inputText ? frameMessage.inputText : "make me follow you"}
            </div>
            {frameMessage && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex' }}>
                  Requester is @{frameMessage.requesterUserData?.username}
                </div>
                <div style={{ display: 'flex' }}>
                  Requester follows caster: {frameMessage.requesterFollowsCaster ? "true" : "false"}
                </div>
                <div style={{ display: 'flex' }}>
                  Caster follows requester: {frameMessage.casterFollowsRequester ? "true" : "false"}
                </div>
                <div style={{ display: 'flex' }}>
                  Requester liked cast: {frameMessage.likedCast ? "true" : "false"}
                </div>
                <div style={{ display: 'flex' }}>
                  Requester recasted cast: {frameMessage.recastedCast ? "true" : "false"}
                </div>
              </div>
            )}
          </div>
        </FrameImage>
        <FrameInput text="put some text here" />
        <FrameButton>
          {state?.active === "1" ? "Active" : "Inactive"}
        </FrameButton>
        <FrameButton>
          {state?.active === "2" ? "Active" : "Inactive"}
        </FrameButton>
        <FrameButton action="link" target={`https://www.google.com`}>
          External
        </FrameButton>
      </FrameContainer>
    </div>
  );
}

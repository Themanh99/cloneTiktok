import Linkify from 'linkify-react';
import 'linkify-plugin-hashtag';
type HashTagProps = { children: React.ReactNode };

function HashTag({ children }: HashTagProps) {

    const optionsHashTag = {
        formatHref: {
            hashTag: (href) => 'hashtag' + href.substr(1),
        },
    };

    return (
        <Linkify options={optionsHashTag} tagName="span">
            {children}
        </Linkify>
    );
}

export default HashTag;
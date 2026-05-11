import classNames from "classnames";
import { NavLink,useNavigation, useResolvedPath } from "react-router";

type AppNavLinkProps = {
  children: React.ReactNode;
  to: string;
};

export default function AppNavLink({ children, to }: AppNavLinkProps) {
  const path = useResolvedPath(to);
  const navigation = useNavigation();
  const isLoading =
    navigation.state === "loading" &&
    navigation.location.pathname === path.pathname;

  return (
    <li className="w-16">
      <NavLink to={to}>
        {({ isActive }) => (
          <div
            className={classNames(
              "py-4 flex justify-center hover:text-blue-400",
              {
                "text-blue-600": isActive || isLoading,
                "animate-pulse": isLoading,
              },
            )}
          >
            {children}
          </div>
        )}
      </NavLink>
    </li>
  );
}

using System.Text.Json;
using System.Text.RegularExpressions;

namespace CNKTOPROJNMTMP.Utils
{
    public class SnakeCaseNamingPolicy : JsonNamingPolicy
    {
        public override string ConvertName(string name)
        {
           Console.WriteLine("name inside convertName.." + name);
           return ConvertToSnakeCase(name);
           
        }

        private static string ConvertToSnakeCase(string name)
        {
            if (string.IsNullOrEmpty(name))
                return name;
            
            var regex = new Regex("_");
            var match = regex.Match(name);
            Console.WriteLine("match..." + match);
            if (match.Success)                
            {
                var stringBuilder = new System.Text.StringBuilder();
                stringBuilder.Append(char.ToLower(name[0]));

                for (int i = 1; i < name.Length; i++)
                {
                    if (char.IsUpper(name[i]))
                    {
                        stringBuilder.Append('_');
                        stringBuilder.Append(char.ToLower(name[i]));
                    }
                    else
                    {
                        stringBuilder.Append(name[i]);
                    }
                }
                return stringBuilder.ToString();
            } else
            {
                char[] charArray = name.ToCharArray();

                for (int i = 0; i < charArray.Length; i++)
                {
                    bool hasNext = i + 1 < charArray.Length;
                    if (i > 0 && hasNext && !char.IsUpper(charArray[i + 1]))
                    {
                        charArray[i] = char.ToLower(charArray[i]);
                        break;
                    }

                    charArray[i] = char.ToLowerInvariant(charArray[i]);
                }

                return new string(charArray);

            }

            
        }

        public string ConvertToCamelCase(string name)
        {
            /*if (name.Contains('_'))
            {
                name = name.Split(new[] { "_" }, StringSplitOptions.RemoveEmptyEntries).Select(s => char.ToUpperInvariant(s[0]) + s.Substring(1, s.Length - 1)).Aggregate(string.Empty, (s1, s2) => s1 + s2);
                Console.WriteLine("name.." + name);
            }*/
            // Custom logic to convert title case to camel case
            if (string.IsNullOrEmpty(name) || !char.IsUpper(name[0]))
                return name;

            char[] charArray = name.ToCharArray();

            for (int i = 0; i < charArray.Length; i++)
            {
                bool hasNext = i + 1 < charArray.Length;
                if (i > 0 && hasNext && !char.IsUpper(charArray[i + 1]))
                {
                    charArray[i] = char.ToLower(charArray[i]);
                    break;
                }

                charArray[i] = char.ToLowerInvariant(charArray[i]);
            }

            return new string(charArray);
        }
    }
}